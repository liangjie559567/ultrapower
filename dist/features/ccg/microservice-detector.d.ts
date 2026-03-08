export interface ServiceInfo {
    name: string;
    path: string;
    dependencies: string[];
}
export declare function detectMicroservices(workingDir: string): Promise<ServiceInfo[]>;
//# sourceMappingURL=microservice-detector.d.ts.map