import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_ROLES, DeptStore, EVALUATION_RUBRICS } from '../engine/data.js';
import { WorkflowEngine } from '../engine/workflowEngine.js';
import { AllocationEngine } from '../engine/allocationEngine.js';
import { api } from '../services/api.js';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Engines initialized with persistent DeptStore
  const workflowEngine = useMemo(() => new WorkflowEngine(DeptStore), []);
  const allocationEngine = useMemo(() => new AllocationEngine(DeptStore), []);

  // Application State
  const [currentRoleKey, setCurrentRoleKey] = useState('HOD');
  const [activeView, setActiveView] = useState('dashboard');
  const [workflows, setWorkflows] = useState(() => workflowEngine.getAll());
  const [facultyList, setFacultyList] = useState(() => allocationEngine.getFacultyList());
  const [teamsList, setTeamsList] = useState(() => allocationEngine.getTeams());
  const [notifications, setNotifications] = useState(() => workflowEngine.notifications);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendDetails, setBackendDetails] = useState(null);

  // Modal State
  const [activeModal, setActiveModal] = useState(null); // { type: 'DETAIL'|'NEW_SUBMISSION'|'RUBRIC'|'OVERRIDE'|'SANCTION', data: any }

  // Toast Notifications
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((type, title, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const currentRoleData = useMemo(() => {
    return INITIAL_ROLES[currentRoleKey] || INITIAL_ROLES.HOD;
  }, [currentRoleKey]);

  // Check Backend Connection and sync data if available
  const syncWithBackend = useCallback(async () => {
    try {
      const health = await api.checkHealth();
      if (health.online) {
        setBackendOnline(true);
        setBackendDetails(health.data);

        // Fetch Workflows from MongoDB Atlas
        try {
          const wfRes = await api.getWorkflows();
          if (wfRes && wfRes.success && Array.isArray(wfRes.data) && wfRes.data.length > 0) {
            setWorkflows(wfRes.data);
            DeptStore.save("WORKFLOWS", wfRes.data);
          }
        } catch (e) {
          console.warn("Backend workflows sync fallback to local store:", e);
        }

        // Fetch Teams from MongoDB Atlas
        try {
          const teamsRes = await api.getTeams();
          if (teamsRes && teamsRes.success && Array.isArray(teamsRes.data) && teamsRes.data.length > 0) {
            setTeamsList(teamsRes.data);
            DeptStore.save("PROJECT_TEAMS", teamsRes.data);
          }
        } catch (e) {
          console.warn("Backend teams sync fallback to local store:", e);
        }

        // Fetch Faculty from MongoDB Atlas
        try {
          const facRes = await api.getFaculty();
          if (facRes && facRes.success && Array.isArray(facRes.data) && facRes.data.length > 0) {
            setFacultyList(facRes.data);
            DeptStore.save("FACULTY", facRes.data);
          }
        } catch (e) {
          console.warn("Backend faculty sync fallback to local store:", e);
        }
      } else {
        setBackendOnline(false);
      }
    } catch {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    syncWithBackend();
    const interval = setInterval(syncWithBackend, 25000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Actions
  const handleTransition = useCallback(async (workflowId, actionKey, comment) => {
    try {
      // Execute on local engine for instant responsiveness
      const updatedWf = workflowEngine.transition(
        workflowId, 
        actionKey, 
        comment, 
        currentRoleKey, 
        currentRoleData
      );
      setWorkflows([...workflowEngine.getAll()]);
      setNotifications([...workflowEngine.notifications]);

      // Sync with Express backend if online
      if (backendOnline) {
        try {
          await api.transitionWorkflow(workflowId, {
            action: actionKey,
            remarks: comment,
            actorRole: currentRoleData.title || currentRoleKey,
            actorName: currentRoleData.name
          });
        } catch (err) {
          console.warn("Express backend transition sync error:", err);
        }
      }

      addToast("success", "Workflow Updated", `Action ${actionKey} successfully committed to audit ledger.`);
      return updatedWf;
    } catch (err) {
      addToast("danger", "Transition Failed", err.message);
      throw err;
    }
  }, [workflowEngine, currentRoleKey, currentRoleData, backendOnline, addToast]);

  const handleCreateWorkflow = useCallback(async (payload) => {
    try {
      const newWf = workflowEngine.createWorkflow(payload, currentRoleKey, currentRoleData);
      setWorkflows([...workflowEngine.getAll()]);
      setNotifications([...workflowEngine.notifications]);

      if (backendOnline) {
        try {
          await api.createWorkflow({
            ...payload,
            submittedBy: {
              id: currentRoleData.id,
              name: currentRoleData.name,
              rollNo: currentRoleData.rollNo || "N/A",
              email: `${currentRoleData.name.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
              degree: currentRoleData.title || "Student",
              teamMembers: payload.teamMembers || [currentRoleData.name]
            }
          });
        } catch (err) {
          console.warn("Express backend create sync error:", err);
        }
      }

      addToast("success", "Proposal Dispatched", `Request ${newWf.id} has entered the approval pipeline.`);
      return newWf;
    } catch (err) {
      addToast("danger", "Submission Error", err.message);
      throw err;
    }
  }, [workflowEngine, currentRoleKey, currentRoleData, backendOnline, addToast]);

  const handleEvaluateMilestone = useCallback(async (workflowId, milestoneId, rubricScores, feedback) => {
    try {
      const milestone = workflowEngine.evaluateMilestone(
        workflowId, 
        milestoneId, 
        rubricScores, 
        feedback, 
        currentRoleData
      );
      setWorkflows([...workflowEngine.getAll()]);
      setNotifications([...workflowEngine.notifications]);

      if (backendOnline) {
        try {
          await api.updateRubric(workflowId, {
            rubricScores,
            qualitativeFeedback: feedback,
            evaluatedBy: currentRoleData.name
          });
        } catch (err) {
          console.warn("Express backend rubric sync error:", err);
        }
      }

      addToast("success", "Defense Evaluated", `Milestone ${milestone.name} scored ${milestone.score}/100.`);
      return milestone;
    } catch (err) {
      addToast("danger", "Evaluation Error", err.message);
      throw err;
    }
  }, [workflowEngine, currentRoleData, backendOnline, addToast]);

  const handleRunAllocation = useCallback(async () => {
    try {
      const result = allocationEngine.runAutomatedMatching();
      setTeamsList([...allocationEngine.getTeams()]);
      setFacultyList([...allocationEngine.getFacultyList()]);
      setSimulationLogs(result.logs || []);

      if (backendOnline) {
        try {
          await api.simulateAllocation();
        } catch (err) {
          console.warn("Express backend allocation sync error:", err);
        }
      }

      addToast("success", "Allocation Complete", "Gale-Shapley matching executed. Quotas balanced.");
      return result;
    } catch (err) {
      addToast("danger", "Matching Failed", err.message);
      throw err;
    }
  }, [allocationEngine, backendOnline, addToast]);

  const handleManualOverride = useCallback(async (teamId, newFacultyId, reason) => {
    try {
      const updatedTeam = allocationEngine.manualOverride(teamId, newFacultyId, reason, currentRoleData.name);
      setTeamsList([...allocationEngine.getTeams()]);
      setFacultyList([...allocationEngine.getFacultyList()]);

      if (backendOnline) {
        try {
          await api.overrideAllocation({
            teamId,
            newFacultyId,
            reason,
            overrideBy: currentRoleData.name
          });
        } catch (err) {
          console.warn("Express backend override sync error:", err);
        }
      }

      addToast("info", "Override Applied", `Team ${teamId} reassigned to mentor with audit justification logged.`);
      return updatedTeam;
    } catch (err) {
      addToast("danger", "Override Error", err.message);
      throw err;
    }
  }, [allocationEngine, currentRoleData, backendOnline, addToast]);

  const handleResetAllocations = useCallback(async () => {
    allocationEngine.resetAllocations();
    setTeamsList([...allocationEngine.getTeams()]);
    setFacultyList([...allocationEngine.getFacultyList()]);
    setSimulationLogs([]);

    if (backendOnline) {
      try {
        await api.resetAllocation();
      } catch (err) {
        console.warn("Express backend reset allocation error:", err);
      }
    }

    addToast("neutral", "Allocations Reverted", "Project allocations reverted to baseline seed.");
  }, [allocationEngine, backendOnline, addToast]);

  const handleResetEntirePortal = useCallback(async () => {
    if (!window.confirm("Are you sure you want to reset all workflows, allocations, and audit logs to factory defaults?")) {
      return;
    }
    DeptStore.reset();
    window.location.reload();
  }, []);

  const handleExportAudit = useCallback(() => {
    const fullAudit = {
      system: "DeptFlow 360 - Departmental Activity & Workflow Management System",
      academicYear: "2026-2027",
      exportedAt: new Date().toISOString(),
      exportedBy: `${currentRoleData.name} (${currentRoleKey})`,
      workflows: workflowEngine.getAll(),
      facultyQuotas: allocationEngine.getFacultyList(),
      projectAllocations: allocationEngine.getTeams()
    };

    const blob = new Blob([JSON.stringify(fullAudit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deptflow360-audit-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("info", "Audit Ledger Exported", "Complete system audit snapshot downloaded as JSON.");
  }, [currentRoleData, currentRoleKey, workflowEngine, allocationEngine, addToast]);

  const value = {
    currentRoleKey,
    setCurrentRoleKey,
    currentRoleData,
    activeView,
    setActiveView,
    workflows,
    facultyList,
    teamsList,
    notifications,
    simulationLogs,
    backendOnline,
    backendDetails,
    activeModal,
    setActiveModal,
    openModal: (type, data = null) => setActiveModal({ type, data }),
    closeModal: () => setActiveModal(null),
    toasts,
    addToast,
    removeToast,
    handleTransition,
    handleCreateWorkflow,
    handleEvaluateMilestone,
    handleRunAllocation,
    handleManualOverride,
    handleResetAllocations,
    handleResetEntirePortal,
    handleExportAudit,
    markAllNotificationsRead: () => {
      workflowEngine.markAllNotificationsRead();
      setNotifications([...workflowEngine.notifications]);
    }
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
