import { Command } from "commander";
import init from "./commands/init";
import run from "./commands/run";
import app from "./package.json";

const program = new Command();

program.name(app.name).description(app.description).version(app.version);

program
  .command("init")
  .description("Init a new GUWA configuration file")
  .action(init);

program
  .command("run")
  .option("-c, --config <char>", "GUWA configuration file")
  .description("Run GUWA Engine application")
  .action(run);

program.parse();
