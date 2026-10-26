import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { INITIAL_ROLES, DeptStore, EVALUATION_RUBRICS } from '../engine/data.js';
import { WorkflowEngine } from '../engine/workflowEngine.js';
import { AllocationEngine } from '../engine/allocationEngine.js';
import { api, getAuthToken, clearAuthToken } from '../services/api.js';

const AppContext = createContext();

// Cryptographic SHA-256 helper for client-side offline fallback
const clientHashPassword = async (password) => {
  const enc = new TextEncoder().encode(password + "_deptflow_salt_2026");
  const hashBuf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const DEFAULT_AUTH_USERS = [
  {
    id: 'USR-HOD-01',
    name: 'Dr. Rajeshwar Sen',
    email: 'hod.it@university.edu',
    plainPass: 'Admin@123',
    role: 'HOD',
    designation: 'Professor & Head of Department'
  },
  {
    id: 'USR-COORD-02',
    name: 'Dr. Ananya Roy',
    email: 'ananya.roy@university.edu',
    plainPass: 'Coord@123',
    role: 'COORDINATOR',
    designation: 'Associate Professor & Project Convener'
  },
  {
    id: 'USR-FAC-03',
    name: 'Dr. Vikramaditya Das',
    email: 'vikram.das@university.edu',
    plainPass: 'Guide@123',
    role: 'FACULTY',
    designation: 'Associate Professor'
  },
  {
    id: 'USR-PG-01',
    name: 'Sneha Mukherjee',
    email: 'sneha.m@university.edu',
    plainPass: 'Student@123',
    role: 'PG_STUDENT',
    designation: 'PG Scholar (M.Tech 2nd Year)'
  },
  {
    id: 'USR-UG-04',
    name: 'Rahul Verma (Team 04 Lead)',
    email: 'team04.lead@university.edu',
    plainPass: 'Student@123',
    role: 'UG_STUDENT',
    designation: 'B.Tech Capstone Lead (Team 04)'
  }
];

export const AppProvider = ({ children }) => {
  // Engines initialized with persistent DeptStore
  const workflowEngine = useMemo(() => new WorkflowEngine(DeptStore), []);
  const allocationEngine = useMemo(() => new AllocationEngine(DeptStore), []);

  // Authentication & User State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('deptflow_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default active persona session
    return {
      id: 'USR-HOD-01',
      name: 'Dr. Rajeshwar Sen',
      email: 'hod.it@university.edu',
      role: 'HOD',
      designation: 'Professor & Head of Department'
    };
  });

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('SIGNIN'); // 'SIGNIN' | 'SIGNUP'

  // Application State
  const [currentRoleKey, setCurrentRoleKey] = useState(() => currentUser?.role || 'HOD');
  const [activeView, setActiveView] = useState('dashboard');
  const [workflows, setWorkflows] = useState(() => workflowEngine.getAll());
  const [facultyList, setFacultyList] = useState(() => allocationEngine.getFacultyList());
  const [teamsList, setTeamsList] = useState(() => allocationEngine.getTeams());
  const [notifications, setNotifications] = useState(() => workflowEngine.notifications);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [backendOnline, setBackendOnline] = useState(false);
  const [backendDetails, setBackendDetails] = useState(null);

  // Modal State
  const [activeModal, setActiveModal] = useState(null);

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

  // Sync role key when user changes
  useEffect(() => {
    if (currentUser?.role) {
      setCurrentRoleKey(currentUser.role);
    }
  }, [currentUser]);

  const currentRoleData = useMemo(() => {
    if (currentUser && currentUser.name) {
      return {
        ...(INITIAL_ROLES[currentRoleKey] || INITIAL_ROLES.HOD),
        name: currentUser.name,
        title: currentUser.designation || INITIAL_ROLES[currentRoleKey]?.title || 'Academic Member',
        email: currentUser.email
      };
    }
    return INITIAL_ROLES[currentRoleKey] || INITIAL_ROLES.HOD;
  }, [currentRoleKey, currentUser]);

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

  // --- Authentication Handlers ---
  const handleSignIn = useCallback(async ({ email, password }) => {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      if (backendOnline) {
        const res = await api.signIn({ email: normalizedEmail, password });
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('deptflow_user', JSON.stringify(res.user));
          setCurrentRoleKey(res.user.role);
          setAuthModalOpen(false);
          addToast('success', 'Sign In Successful', `Authenticated as ${res.user.name} (${res.user.role})`);
          return res.user;
        }
      }
    } catch (apiErr) {
      console.warn("API sign in failed, testing local hashed auth fallback:", apiErr.message);
    }

    // Resilient Local Cryptographic Fallback (Matches default accounts or locally registered users)
    const localRegistered = DeptStore.get("REGISTERED_USERS") || [];
    const allUsers = [...DEFAULT_AUTH_USERS, ...localRegistered];
    const candidate = allUsers.find(u => u.email.toLowerCase() === normalizedEmail);

    if (!candidate) {
      addToast('danger', 'Sign In Failed', 'No account found with this email address.');
      throw new Error('No account found with this email address.');
    }

    const candidateHash = await clientHashPassword(password);
    let isMatch = false;

    if (candidate.plainPass && candidate.plainPass === password) {
      isMatch = true;
    } else if (candidate.passwordHash && candidate.passwordHash === candidateHash) {
      isMatch = true;
    }

    if (!isMatch) {
      addToast('danger', 'Authentication Failed', 'Invalid password. Verification check failed.');
      throw new Error('Invalid password.');
    }

    const userObj = {
      id: candidate.id || `USR-${Date.now()}`,
      name: candidate.name,
      email: candidate.email,
      role: candidate.role,
      designation: candidate.designation || 'Academic Member'
    };

    setCurrentUser(userObj);
    localStorage.setItem('deptflow_user', JSON.stringify(userObj));
    setCurrentRoleKey(userObj.role);
    setAuthModalOpen(false);
    addToast('success', 'Sign In Successful', `Authenticated as ${userObj.name} (${userObj.role})`);
    return userObj;
  }, [backendOnline, addToast]);

  const handleSignUp = useCallback(async ({ name, email, password, role, designation }) => {
    const normalizedEmail = email.toLowerCase().trim();

    if (!name || !email || !password) {
      addToast('danger', 'Registration Incomplete', 'Please fill in all required fields.');
      throw new Error('Missing required fields.');
    }

    if (password.length < 6) {
      addToast('danger', 'Password Too Weak', 'Password must be at least 6 characters.');
      throw new Error('Password too short.');
    }

    try {
      if (backendOnline) {
        const res = await api.signUp({
          name,
          email: normalizedEmail,
          password,
          role,
          designation
        });
        if (res && res.success && res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('deptflow_user', JSON.stringify(res.user));
          setCurrentRoleKey(res.user.role);
          setAuthModalOpen(false);
          addToast('success', 'Account Registered', `Welcome to DeptFlow 360, ${res.user.name}!`);
          return res.user;
        }
      }
    } catch (apiErr) {
      console.warn("API sign up failed, registering in local store:", apiErr.message);
    }

    // Local Fallback Registration with SHA-256 Hashing
    const localRegistered = DeptStore.get("REGISTERED_USERS") || [];
    const exists = [...DEFAULT_AUTH_USERS, ...localRegistered].some(u => u.email.toLowerCase() === normalizedEmail);

    if (exists) {
      addToast('danger', 'Registration Error', 'An account with this email already exists.');
      throw new Error('Email already registered.');
    }

    const passwordHash = await clientHashPassword(password);
    const newLocalUser = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: role || 'UG_STUDENT',
      designation: designation || (role?.includes('STUDENT') ? 'Student Scholar' : 'Faculty Member'),
      createdAt: new Date().toISOString()
    };

    localRegistered.push(newLocalUser);
    DeptStore.save("REGISTERED_USERS", localRegistered);

    const userObj = {
      id: newLocalUser.id,
      name: newLocalUser.name,
      email: newLocalUser.email,
      role: newLocalUser.role,
      designation: newLocalUser.designation
    };

    setCurrentUser(userObj);
    localStorage.setItem('deptflow_user', JSON.stringify(userObj));
    setCurrentRoleKey(userObj.role);
    setAuthModalOpen(false);
    addToast('success', 'Account Registered', `New account created for ${userObj.name} (${userObj.role}).`);
    return userObj;
  }, [backendOnline, addToast]);

  const handleSignOut = useCallback(() => {
    api.signOut();
    localStorage.removeItem('deptflow_user');
    setCurrentUser(null);
    setCurrentRoleKey('UG_STUDENT');
    addToast('info', 'Signed Out', 'Your session has been terminated safely.');
  }, [addToast]);

  // Actions
  const handleTransition = useCallback(async (workflowId, actionKey, comment) => {
    try {
      const updatedWf = workflowEngine.transition(
        workflowId, 
        actionKey, 
        comment, 
        currentRoleKey, 
        currentRoleData
      );
      setWorkflows([...workflowEngine.getAll()]);
      setNotifications([...workflowEngine.notifications]);

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
              id: currentRoleData.id || currentUser?.id,
              name: currentRoleData.name,
              rollNo: currentRoleData.rollNo || "N/A",
              email: currentRoleData.email || `${currentRoleData.name.toLowerCase().replace(/\s+/g, ".")}@university.edu`,
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
  }, [workflowEngine, currentRoleKey, currentRoleData, currentUser, backendOnline, addToast]);

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
            rubricScores: {
              literatureReview: rubricScores.literatureReview || rubricScores.litScore || 25,
              methodology: rubricScores.methodology || rubricScores.rigorScore || 35,
              presentation: rubricScores.presentation || rubricScores.oralScore || 26
            },
            qualitativeFeedback: feedback,
            evaluatedBy: currentRoleData.name
          });
        } catch (err) {
          console.warn("Express backend rubric sync error:", err);
        }
      }

      addToast("success", "Milestone Graded", `Defense score sealed with Outcome Grade ${milestone.grade || 'O'}.`);
      return milestone;
    } catch (err) {
      addToast("danger", "Grading Failed", err.message);
      throw err;
    }
  }, [workflowEngine, currentRoleData, backendOnline, addToast]);

  const handleRunAllocation = useCallback(async () => {
    try {
      const result = allocationEngine.runAllocation();
      setTeamsList([...allocationEngine.getTeams()]);
      setFacultyList([...allocationEngine.getFacultyList()]);
      setSimulationLogs(result.logs || []);

      if (backendOnline) {
        try {
          await api.simulateAllocation();
        } catch (err) {
          console.warn("Express backend allocation simulation sync error:", err);
        }
      }

      addToast("success", "Allocation Solved", `Gale-Shapley matching complete: ${result.matchCount} groups stably assigned.`);
      return result;
    } catch (err) {
      addToast("danger", "Allocation Error", err.message);
      throw err;
    }
  }, [allocationEngine, backendOnline, addToast]);

  const handleManualOverride = useCallback(async (teamId, newFacultyId, reason) => {
    try {
      const updated = allocationEngine.manualOverride(teamId, newFacultyId, reason, currentRoleData.name);
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

      addToast("warning", "Manual Reassignment Applied", `Team ${teamId} reassigned to ${newFacultyId}. Audit logged.`);
      return updated;
    } catch (err) {
      addToast("danger", "Override Failed", err.message);
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
        console.warn("Backend reset allocation error:", err);
      }
    }

    addToast("info", "Allocation Reset", "Student preferences and faculty quotas restored to factory baseline.");
  }, [allocationEngine, backendOnline, addToast]);

  const handleResetEntirePortal = useCallback(async () => {
    DeptStore.clear();
    workflowEngine.resetDefaults();
    allocationEngine.resetAllocations();
    setWorkflows([...workflowEngine.getAll()]);
    setFacultyList([...allocationEngine.getFacultyList()]);
    setTeamsList([...allocationEngine.getTeams()]);
    setNotifications([...workflowEngine.notifications]);
    setSimulationLogs([]);

    if (backendOnline) {
      try {
        await api.resetWorkflows();
        await api.resetAllocation();
      } catch (err) {
        console.warn("Backend reset portal error:", err);
      }
    }

    addToast("info", "Portal Reset Complete", "All workflows and local state reset to clean baseline.");
  }, [workflowEngine, allocationEngine, backendOnline, addToast]);

  const handleExportAudit = useCallback(() => {
    const fullAudit = {
      system: "DeptFlow 360 Departmental Activity Management Suite",
      version: "2.5.0",
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
    // Auth
    currentUser,
    isAuthenticated: Boolean(currentUser),
    authModalOpen,
    authMode,
    openAuthModal: (mode = 'SIGNIN') => {
      setAuthMode(mode);
      setAuthModalOpen(true);
    },
    closeAuthModal: () => setAuthModalOpen(false),
    handleSignIn,
    handleSignUp,
    handleSignOut,

    // Core roles & views
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
