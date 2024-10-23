import { BaseCommand } from '@adonisjs/ace';
export declare class CreateNewApp extends BaseCommand {
    #private;
    static commandName: string;
    static description: string;
    /**
     * The directory where the project will be created
     */
    destination: string;
    version: string;
    web: boolean;
    native: boolean;
    branch?: string;
    packageInstall: boolean;
    gitInit: boolean;
    run(): Promise<void>;
}
