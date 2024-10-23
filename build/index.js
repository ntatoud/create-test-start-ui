import { HelpCommand, Kernel } from '@adonisjs/ace';
import { CreateNewApp } from './commands/main.js';
Kernel.defaultCommand = CreateNewApp;
export const kernel = Kernel.create();
kernel.defineFlag('help', {
    type: 'boolean',
    description: HelpCommand.description,
});
kernel.on('help', async (command, $kernel, parsed) => {
    parsed.args.unshift(command.commandName);
    await new HelpCommand($kernel, parsed, kernel.ui, kernel.prompt).exec();
    return $kernel.shortcircuit();
});
