export const IPC_CHANNELS = {
  events: {
    stateChanged: "desktop:state-changed",
  },
  invoke: {
    acceptAssignment: "desktop:accept-assignment",
    clearFinishedAssignments: "desktop:clear-finished-assignments",
    deliverAssignment: "desktop:deliver-assignment",
    failAssignment: "desktop:fail-assignment",
    getSnapshot: "desktop:get-snapshot",
    probeRuntimes: "desktop:probe-runtimes",
    registerNode: "desktop:register-node",
    rejectAssignment: "desktop:reject-assignment",
    saveConnectionConfig: "desktop:save-connection-config",
    seedDemoAssignments: "desktop:seed-demo-assignments",
    setAvailability: "desktop:set-availability",
    startAssignment: "desktop:start-assignment",
    updatePolicy: "desktop:update-policy",
    waitAssignment: "desktop:wait-assignment",
  },
} as const;
