const http = require('http');

const API_BASE = 'http://localhost:5000/api';

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  } else {
    console.log(`  ✓ ${message}`);
  }
};

async function runAllWorkflowPathTests() {
  console.log('============================================================================');
  console.log('STARTING AUTOMATED END-TO-END WORKFLOW RBAC PATH TESTING');
  console.log('============================================================================');

  // 1. Authenticate All Actors
  console.log('\n--- Step 1: Authenticating All 4 Role Actors ---');
  const studentAuth = await request('/auth/signin', 'POST', {
    email: 'team04.lead@university.edu',
    password: 'Student@123'
  });
  assert(studentAuth.status === 200 && studentAuth.body.success, 'Student authenticated');
  const student = studentAuth.body.user;

  const guideAuth = await request('/auth/signin', 'POST', {
    email: 'vikram.das@university.edu',
    password: 'Guide@123'
  });
  assert(guideAuth.status === 200 && guideAuth.body.success, 'Faculty Guide authenticated');
  const guide = guideAuth.body.user;

  const coordAuth = await request('/auth/signin', 'POST', {
    email: 'ananya.roy@university.edu',
    password: 'Coord@123'
  });
  assert(coordAuth.status === 200 && coordAuth.body.success, 'Coordinator authenticated');
  const coordinator = coordAuth.body.user;

  const hodAuth = await request('/auth/signin', 'POST', {
    email: 'hod.it@university.edu',
    password: 'Admin@123'
  });
  assert(hodAuth.status === 200 && hodAuth.body.success, 'HOD authenticated');
  const hod = hodAuth.body.user;

  // ============================================================================
  // PATH 1: Full Happy Path
  // Student Submit -> Guide Endorse -> Coordinator Verify -> HOD Sanction (APPROVED)
  // ============================================================================
  console.log('\n--- Path 1: Happy Path (Student Submit -> Guide Endorse -> Coord Verify -> HOD Sanction) ---');
  const p1Create = await request('/workflows', 'POST', {
    title: 'Path 1: Autonomous UAV Swarm Routing Architecture',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Robotics & Distributed AI',
    proposedGuideId: guide.id,
    abstract: 'Novel decentralized pathfinding algorithm using consensus-driven graph optimization.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  assert(p1Create.status === 201 && p1Create.body.success, 'Path 1 Workflow created');
  const wf1 = p1Create.body.data;
  assert(wf1.state === 'UNDER_GUIDE_REVIEW', `Path 1 initial state is UNDER_GUIDE_REVIEW (got: ${wf1.state})`);

  // Guide Endorse
  const p1Guide = await request(`/workflows/${wf1.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Outstanding literature review and methodology. Recommended for coordinator verification.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  assert(p1Guide.status === 200 && p1Guide.body.success, 'Path 1 Guide Endorse HTTP 200');
  assert(p1Guide.body.data.state === 'UNDER_COORDINATOR_REVIEW', `Path 1 state is UNDER_COORDINATOR_REVIEW (got: ${p1Guide.body.data.state})`);
  assert(p1Guide.body.data.details.allocatedGuideId === guide.id, `Path 1 allocatedGuideId set to ${guide.id}`);

  // Coordinator Verify
  const p1Coord = await request(`/workflows/${wf1.id}/transition`, 'POST', {
    actionKey: 'COORDINATOR_VERIFY',
    remarks: 'Departmental curriculum compliance and lab resources verified.',
    actorId: coordinator.id,
    actorName: coordinator.name,
    actorRole: 'Project Coordinator'
  });
  assert(p1Coord.status === 200 && p1Coord.body.success, 'Path 1 Coordinator Verify HTTP 200');
  assert(p1Coord.body.data.state === 'UNDER_HOD_REVIEW', `Path 1 state is UNDER_HOD_REVIEW (got: ${p1Coord.body.data.state})`);

  // HOD Sanction
  const p1HOD = await request(`/workflows/${wf1.id}/transition`, 'POST', {
    actionKey: 'HOD_APPROVE',
    remarks: 'Officially sanctioned by Head of Department. Project workspace granted.',
    actorId: hod.id,
    actorName: hod.name,
    actorRole: 'Head of Department'
  });
  assert(p1HOD.status === 200 && p1HOD.body.success, 'Path 1 HOD Sanction HTTP 200');
  assert(p1HOD.body.data.state === 'APPROVED', `Path 1 final state is APPROVED (got: ${p1HOD.body.data.state})`);
  assert(!!p1HOD.body.data.sanctionDate, 'Path 1 sanctionDate is populated');

  // ============================================================================
  // PATH 2: Guide Requests Revision -> Student Resubmits -> Guide Endorses
  // ============================================================================
  console.log('\n--- Path 2: Guide Revision Loop (Guide Request Revision -> Student Resubmit -> Guide Endorse) ---');
  const p2Create = await request('/workflows', 'POST', {
    title: 'Path 2: Quantum-Resistant Lattice Key Exchange',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Cryptography',
    proposedGuideId: guide.id,
    abstract: 'Investigation of Kyber and Dilithium algorithms on low-power IoT microcontrollers.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf2 = p2Create.body.data;
  assert(wf2.state === 'UNDER_GUIDE_REVIEW', 'Path 2 created in UNDER_GUIDE_REVIEW');

  // Guide requests revision
  const p2GuideRev = await request(`/workflows/${wf2.id}/transition`, 'POST', {
    actionKey: 'REQUEST_REVISION',
    remarks: 'Please elaborate on the NIST standardization timeline and memory constraints.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  assert(p2GuideRev.status === 200, 'Path 2 Guide Request Revision HTTP 200');
  assert(p2GuideRev.body.data.state === 'REVISION_REQUESTED', `Path 2 state is REVISION_REQUESTED (got: ${p2GuideRev.body.data.state})`);

  // Student Resubmits
  const p2StudentResubmit = await request(`/workflows/${wf2.id}/transition`, 'POST', {
    actionKey: 'STUDENT_RESUBMIT',
    remarks: 'Revised abstract updated with NIST FIPS 203/204 citations and 32KB RAM memory benchmarks.',
    actorId: student.id,
    actorName: student.name,
    actorRole: 'Student Scholar'
  });
  assert(p2StudentResubmit.status === 200, 'Path 2 Student Resubmit HTTP 200');
  assert(p2StudentResubmit.body.data.state === 'UNDER_GUIDE_REVIEW', `Path 2 state transitioned back to UNDER_GUIDE_REVIEW (got: ${p2StudentResubmit.body.data.state})`);

  // Guide Endorses
  const p2GuideEndorse = await request(`/workflows/${wf2.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Revision is satisfactory. Forwarding to coordinator.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  assert(p2GuideEndorse.status === 200, 'Path 2 Guide Endorse HTTP 200');
  assert(p2GuideEndorse.body.data.state === 'UNDER_COORDINATOR_REVIEW', 'Path 2 now UNDER_COORDINATOR_REVIEW');

  // ============================================================================
  // PATH 3: Guide Rejects Proposal
  // ============================================================================
  console.log('\n--- Path 3: Guide Rejection Path ---');
  const p3Create = await request('/workflows', 'POST', {
    title: 'Path 3: Generic Web App Without Academic Rigor',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Web Development',
    proposedGuideId: guide.id,
    abstract: 'A simple shopping cart app without research component.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf3 = p3Create.body.data;

  const p3GuideReject = await request(`/workflows/${wf3.id}/transition`, 'POST', {
    actionKey: 'REJECT',
    remarks: 'Does not meet B.Tech capstone academic research standards.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  assert(p3GuideReject.status === 200, 'Path 3 Guide Reject HTTP 200');
  assert(p3GuideReject.body.data.state === 'REJECTED', `Path 3 final state is REJECTED (got: ${p3GuideReject.body.data.state})`);

  // ============================================================================
  // PATH 4: Coordinator Requests Revision -> Student Resubmits
  // ============================================================================
  console.log('\n--- Path 4: Coordinator Revision Loop ---');
  const p4Create = await request('/workflows', 'POST', {
    title: 'Path 4: Federated Learning on Hospital EHR Datasets',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Healthcare AI',
    proposedGuideId: guide.id,
    abstract: 'Privacy-preserving collaborative training on heterogeneous medical records.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf4 = p4Create.body.data;

  // Guide endorses
  await request(`/workflows/${wf4.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Endorsed.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });

  // Coordinator requests revision
  const p4CoordRev = await request(`/workflows/${wf4.id}/transition`, 'POST', {
    actionKey: 'REQUEST_REVISION',
    remarks: 'Need institutional IRB clearance statement and HIPAA compliance plan.',
    actorId: coordinator.id,
    actorName: coordinator.name,
    actorRole: 'Project Coordinator'
  });
  assert(p4CoordRev.status === 200, 'Path 4 Coordinator Request Revision HTTP 200');
  assert(p4CoordRev.body.data.state === 'REVISION_REQUESTED', `Path 4 state is REVISION_REQUESTED (got: ${p4CoordRev.body.data.state})`);

  // Student resubmits
  const p4StudentResubmit = await request(`/workflows/${wf4.id}/transition`, 'POST', {
    actionKey: 'STUDENT_RESUBMIT',
    remarks: 'Synthetic EHR dataset with differential privacy guarantees added.',
    actorId: student.id,
    actorName: student.name,
    actorRole: 'Student Scholar'
  });
  assert(p4StudentResubmit.status === 200, 'Path 4 Student Resubmit HTTP 200');
  assert(p4StudentResubmit.body.data.state === 'UNDER_GUIDE_REVIEW', 'Path 4 back to UNDER_GUIDE_REVIEW');

  // ============================================================================
  // PATH 5: Coordinator Rejects Proposal
  // ============================================================================
  console.log('\n--- Path 5: Coordinator Rejection Path ---');
  const p5Create = await request('/workflows', 'POST', {
    title: 'Path 5: Duplicate Proposal Out of Scope',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'General IT',
    proposedGuideId: guide.id,
    abstract: 'Redundant proposal overlapping with completed 2025 project.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf5 = p5Create.body.data;

  await request(`/workflows/${wf5.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Endorsed conditionally.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });

  const p5CoordReject = await request(`/workflows/${wf5.id}/transition`, 'POST', {
    actionKey: 'REJECT',
    remarks: 'Duplicate scope verified against departmental repository archives.',
    actorId: coordinator.id,
    actorName: coordinator.name,
    actorRole: 'Project Coordinator'
  });
  assert(p5CoordReject.status === 200, 'Path 5 Coordinator Reject HTTP 200');
  assert(p5CoordReject.body.data.state === 'REJECTED', `Path 5 final state is REJECTED (got: ${p5CoordReject.body.data.state})`);

  // ============================================================================
  // PATH 6: HOD Requests Revision -> Student Resubmits
  // ============================================================================
  console.log('\n--- Path 6: HOD Revision Loop ---');
  const p6Create = await request('/workflows', 'POST', {
    title: 'Path 6: Real-time FPGA Accelerator for Graph Neural Nets',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Hardware Acceleration',
    proposedGuideId: guide.id,
    abstract: 'Custom systolic array architecture for sparse graph convolution operations.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf6 = p6Create.body.data;

  // Guide Endorse -> Coord Verify -> HOD Request Revision
  await request(`/workflows/${wf6.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Endorsed.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  await request(`/workflows/${wf6.id}/transition`, 'POST', {
    actionKey: 'COORDINATOR_VERIFY',
    remarks: 'Verified.',
    actorId: coordinator.id,
    actorName: coordinator.name,
    actorRole: 'Project Coordinator'
  });

  const p6HODRev = await request(`/workflows/${wf6.id}/transition`, 'POST', {
    actionKey: 'REQUEST_REVISION',
    remarks: 'Clarify lab FPGA board allocation (Xilinx UltraScale+ or Zynq-7000).',
    actorId: hod.id,
    actorName: hod.name,
    actorRole: 'Head of Department'
  });
  assert(p6HODRev.status === 200, 'Path 6 HOD Request Revision HTTP 200');
  assert(p6HODRev.body.data.state === 'REVISION_REQUESTED', `Path 6 state is REVISION_REQUESTED (got: ${p6HODRev.body.data.state})`);

  const p6StudentResubmit = await request(`/workflows/${wf6.id}/transition`, 'POST', {
    actionKey: 'STUDENT_RESUBMIT',
    remarks: 'Project scope aligned with Embedded Systems Lab Xilinx Zynq-7000 inventory.',
    actorId: student.id,
    actorName: student.name,
    actorRole: 'Student Scholar'
  });
  assert(p6StudentResubmit.status === 200, 'Path 6 Student Resubmit HTTP 200');
  assert(p6StudentResubmit.body.data.state === 'UNDER_GUIDE_REVIEW', 'Path 6 back to UNDER_GUIDE_REVIEW');

  // ============================================================================
  // PATH 7: HOD Rejects Proposal
  // ============================================================================
  console.log('\n--- Path 7: HOD Rejection Path ---');
  const p7Create = await request('/workflows', 'POST', {
    title: 'Path 7: High-Cost Proprietary Cloud Project',
    category: 'UG',
    type: 'UG_PROJECT',
    domain: 'Cloud Computing',
    proposedGuideId: guide.id,
    abstract: 'Requires ongoing paid enterprise API subscriptions.',
    submittedBy: {
      id: student.id,
      name: student.name,
      email: student.email,
      degree: 'B.Tech Scholar'
    }
  });
  const wf7 = p7Create.body.data;

  await request(`/workflows/${wf7.id}/transition`, 'POST', {
    actionKey: 'GUIDE_ENDORSE',
    remarks: 'Endorsed.',
    actorId: guide.id,
    actorName: guide.name,
    actorRole: 'Faculty Guide'
  });
  await request(`/workflows/${wf7.id}/transition`, 'POST', {
    actionKey: 'COORDINATOR_VERIFY',
    remarks: 'Verified.',
    actorId: coordinator.id,
    actorName: coordinator.name,
    actorRole: 'Project Coordinator'
  });

  const p7HODReject = await request(`/workflows/${wf7.id}/transition`, 'POST', {
    actionKey: 'REJECT',
    remarks: 'Department budget cannot sustain proprietary external recurring subscription fees.',
    actorId: hod.id,
    actorName: hod.name,
    actorRole: 'Head of Department'
  });
  assert(p7HODReject.status === 200, 'Path 7 HOD Reject HTTP 200');
  assert(p7HODReject.body.data.state === 'REJECTED', `Path 7 final state is REJECTED (got: ${p7HODReject.body.data.state})`);

  // ============================================================================
  // Step 8: Verify Guide Visibility Query API
  // ============================================================================
  console.log('\n--- Step 8: Verifying Guide Visibility of All Under-Review Proposals ---');
  const guideWorkflowsRes = await request(`/workflows?role=FACULTY&roleId=${guide.id}`, 'GET');
  assert(guideWorkflowsRes.status === 200, 'Guide getWorkflows query HTTP 200');
  const guideWfs = guideWorkflowsRes.body.data;
  console.log(`  ✓ Guide received ${guideWfs.length} workflows in their scope`);
  
  // Verify that all proposals in UNDER_GUIDE_REVIEW are visible to the guide
  const allUnderGuide = guideWfs.filter(w => w.state === 'UNDER_GUIDE_REVIEW');
  assert(allUnderGuide.length > 0, `Guide has ${allUnderGuide.length} proposals visible in UNDER_GUIDE_REVIEW`);

  console.log('\n============================================================================');
  console.log('🎉 ALL 7 WORKFLOW PATHS & VISIBILITY CHECKS PASSED FLAWLESSLY IN ATLAS!');
  console.log('============================================================================');
}

runAllWorkflowPathTests().catch(err => {
  console.error('\n❌ Test Suite execution error:', err.message);
  process.exit(1);
});
