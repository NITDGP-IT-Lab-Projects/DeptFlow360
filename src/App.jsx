import React from 'react';
import { useApp } from './context/AppContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Topbar } from './components/Topbar.jsx';
import { ToastContainer } from './components/Toast.jsx';

import { DashboardView } from './components/views/DashboardView.jsx';
import { ApprovalsView } from './components/views/ApprovalsView.jsx';
import { AllocationView } from './components/views/AllocationView.jsx';
import { UgPgDeskView } from './components/views/UgPgDeskView.jsx';
import { RubricEvalView } from './components/views/RubricEvalView.jsx';
import { FacultyDirView } from './components/views/FacultyDirView.jsx';
import { ArchitectureView } from './components/views/ArchitectureView.jsx';

import { WorkflowDetailModal } from './components/modals/WorkflowDetailModal.jsx';
import { NewSubmissionModal } from './components/modals/NewSubmissionModal.jsx';
import { RubricScoringModal } from './components/modals/RubricScoringModal.jsx';
import { ManualOverrideModal } from './components/modals/ManualOverrideModal.jsx';
import { SanctionLetterModal } from './components/modals/SanctionLetterModal.jsx';

export const App = () => {
  const { activeView, activeModal } = useApp();

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="main-area">
        <Topbar />

        <section className="viewport">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'approvals' && <ApprovalsView />}
          {activeView === 'allocation' && <AllocationView />}
          {activeView === 'ugpg_desk' && <UgPgDeskView />}
          {activeView === 'rubric_eval' && <RubricEvalView />}
          {activeView === 'faculty_dir' && <FacultyDirView />}
          {activeView === 'architecture' && <ArchitectureView />}
        </section>
      </main>

      {/* Interactive Modals */}
      {activeModal?.type === 'DETAIL' && (
        <WorkflowDetailModal workflow={activeModal.data} />
      )}
      {activeModal?.type === 'NEW_SUBMISSION' && (
        <NewSubmissionModal />
      )}
      {activeModal?.type === 'RUBRIC' && (
        <RubricScoringModal 
          workflow={activeModal.data?.workflow} 
          milestone={activeModal.data?.milestone} 
        />
      )}
      {activeModal?.type === 'OVERRIDE' && (
        <ManualOverrideModal team={activeModal.data} />
      )}
      {activeModal?.type === 'SANCTION' && (
        <SanctionLetterModal workflow={activeModal.data} />
      )}

      {/* Notification Toast Stack */}
      <ToastContainer />
    </div>
  );
};

export default App;
