import { existsSync } from 'node:fs';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { cwd } from 'node:process';
import { BaseCommand, args, flags } from '@adonisjs/ace';
import { execa } from 'execa';
import { downloadTemplate } from 'giget';
import { pastel } from 'gradient-string';

const templates = [
	{
		name: 'StartUI [Web]',
		source: 'github:BearStudio/start-ui-web',
		branch: 'master',
		alias: 'web' as const,
		hint: 'The Web Starter',
	},
	{
		name: 'StartUI [Native]',
		source: 'github:BearStudio/start-ui-native',
		alias: 'native' as const,
		branch: 'main',
		hint: 'The React native starter',
	},
];
export class CreateNewApp extends BaseCommand {
	static override commandName = 'create-test-start-ui';
	static override description = 'Create a new Start UI application';

	/**
	 * The directory where the project will be created
	 */
	@args.string({ description: 'Destination directory', required: false })
	declare destination: string;

	@flags.string({
		alias: 'v',
	})
	declare version: string;

	@flags.boolean({
		default: false,
	})
	declare web: boolean;

	@flags.boolean({
		default: false,
	})
	declare native: boolean;

	@flags.string({
		alias: 'b',
	})
	declare branch?: string;

	@flags.boolean({
		default: true,
	})
	declare packageInstall: boolean;

	@flags.boolean({
		default: true,
	})
	declare gitInit: boolean;

	/**
	 * Prints AdonisJS as ASCII art
	 */
	#printBannerArt() {
		const title = Buffer.from(
			'ICAgICBfX19fXyBfICAgICAgICAgICAgIF8gICBfICAgXyBfX19fXyANCiAgICAvICBfX198IHwgICAgICAgICAgIHwgfCB8IHwgfCB8XyAgIF98DQogICAgXCBgLS0ufCB8XyBfXyBfIF8gX198IHxffCB8IHwgfCB8IHwgIA0KICAgICBgLS0uIFwgX18vIF9gIHwgJ19ffCBfX3wgfCB8IHwgfCB8ICANCiAgICAvXF9fLyAvIHx8IChffCB8IHwgIHwgfF98IHxffCB8X3wgfF8gDQogICAgXF9fX18vIFxfX1xfXyxffF98ICAgXF9ffFxfX18vIFxfX18vIA0KICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIA==',
			'base64',
		).toString();

		this.logger.log('');
		this.logger.log(`${pastel.multiline(title)}`);
		this.logger.log('');
	}

	/**
	 * Prompt for the destination directory
	 */
	async #promptForDestination() {
		if (!this.destination) {
			this.destination = await this.prompt.ask(
				'Where should we create your new project',
				{
					default: './my-app',
				},
			);
		}

		this.destination = isAbsolute(this.destination)
			? this.destination
			: join(cwd(), this.destination);
	}

	/**
	 * Prompt for support version
	 */
	async #promptForStarterChoice() {
		if (!this.web && !this.native) {
			const template = await this.prompt.choice('Which one?', templates);

			return templates.find((t) => t.name === template)!;
		}

		if (this.web) {
			return templates.find((t) => t.alias === 'web')!;
		}

		return templates.find((t) => t.alias === 'native')!;
	}

	async #printSuccessMessage() {
		this.logger.log('');

		const successMessage = this.ui
			.instructions()
			.heading('Your Start UI project has been created successfully!')
			.add(this.colors.cyan(`cd ${relative(cwd(), this.destination)}`))
			.add(this.colors.cyan('pnpm run dev'));

		if (this.web) {
			successMessage
				.add('')
				.add('Want to know more?')
				.add('Want to see which technologies StartUI uses?')
				.add(
					`Check ${this.colors.yellow('https://docs.web.start-ui.com/')}`,
				);
		}
		successMessage.render();
	}
	override async run() {
		this.#printBannerArt();

		await this.#promptForDestination();

		let { alias, branch, name, source } =
			await this.#promptForStarterChoice();

		this[alias] = true;

		source = `${source}#${this.branch ?? branch}`;

		const tasks = this.ui.tasks({ verbose: false });

		tasks
			.add(`Download ${name}`, async (task) => {
				task.update(`Dowloading ${source}`);

				await downloadTemplate(source, {
					dir: this.destination,
				});

				return `Downloaded ${name}`;
			})
			.addIf(
				this.gitInit === true,
				'Initialize git repository',
				async (task) => {
					await execa('git', ['init'], { cwd: this.destination });
					await execa('git', ['add', '.'], { cwd: this.destination });
					await execa(
						'git',
						[
							'commit',
							'-m',
							'feat: init repository from create-start-ui',
						],
						{ cwd: this.destination },
					);
					return 'Initialized git repository';
				},
			)
			.addIf(
				this.packageInstall === true,
				'Install packages',
				async (task) => {
					const spinner = this.logger.await(
						'installing dependencies',
						{},
					);

					spinner.tap((line) => task.update(line));
					spinner.start();

					try {
						let packageManager = 'yarn';
						const pnpmLockFile = resolve(
							this.destination,
							'pnpm-loc.yaml',
						);
						if (existsSync(pnpmLockFile)) {
							packageManager = 'pnpm';
						}

						await execa(packageManager, ['install']);
						return `Packages installed using "${packageManager}"`;
					} finally {
						spinner.stop();
					}
				},
			);

		await tasks.run();

		/**
		 * End the installation
		 */
		if (tasks.getState() === 'succeeded') {
			this.#printSuccessMessage();
		} else {
			this.exitCode = 1;
		}
	}
}
