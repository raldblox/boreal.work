import type {
  AvailabilityStatus,
  ConnectionConfigInput,
  DesktopPolicy,
  DesktopSnapshot,
  RegisterNodeInput,
} from "../shared/contracts";

declare global {
  interface Window {
    borealDesktop: {
      acceptAssignment(id: string): Promise<DesktopSnapshot>;
      clearFinishedAssignments(): Promise<DesktopSnapshot>;
      deliverAssignment(id: string): Promise<DesktopSnapshot>;
      failAssignment(id: string): Promise<DesktopSnapshot>;
      getSnapshot(): Promise<DesktopSnapshot>;
      probeRuntimes(): Promise<DesktopSnapshot>;
      registerNode(input: RegisterNodeInput): Promise<DesktopSnapshot>;
      rejectAssignment(id: string): Promise<DesktopSnapshot>;
      saveConnectionConfig(input: ConnectionConfigInput): Promise<DesktopSnapshot>;
      seedDemoAssignments(): Promise<DesktopSnapshot>;
      setAvailability(status: AvailabilityStatus): Promise<DesktopSnapshot>;
      startAssignment(id: string): Promise<DesktopSnapshot>;
      subscribe(listener: (snapshot: DesktopSnapshot) => void): () => void;
      updatePolicy(policy: DesktopPolicy): Promise<DesktopSnapshot>;
      waitAssignment(id: string): Promise<DesktopSnapshot>;
    };
  }
}

export {};
