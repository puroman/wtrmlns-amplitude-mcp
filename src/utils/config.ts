import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { AmplitudeCredentials } from "../types/amplitude.js";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("amplitude-api-key", {
    type: "string",
    description: "Amplitude API key"
  })
  .option("amplitude-secret-key", {
    type: "string",
    description: "Amplitude secret key"
  })
  .option("amplitude-region", {
    type: "string",
    choices: ["us", "eu"],
    description: "Amplitude data region (us or eu)"
  })
  .option("project-dir", {
    type: "string",
    description: "Path to project-specific prompts and examples directory"
  })
  .help()
  .argv;

export const getAmplitudeCredentials = (): AmplitudeCredentials => {
  const apiKey = (argv["amplitude-api-key"] as string) || process.env.AMPLITUDE_API_KEY || "";
  const secretKey = (argv["amplitude-secret-key"] as string) || process.env.AMPLITUDE_SECRET_KEY || "";

  if (!apiKey || !secretKey) {
    const errorMsg = "Error: Amplitude API credentials not provided via --amplitude-api-key/--amplitude-secret-key or AMPLITUDE_API_KEY/AMPLITUDE_SECRET_KEY environment variables";
    console.error(errorMsg);
    console.error(`API Key present: ${!!apiKey}, Secret Key present: ${!!secretKey}`);
    console.error(`Environment variables: AMPLITUDE_API_KEY=${process.env.AMPLITUDE_API_KEY ? 'SET' : 'NOT SET'}, AMPLITUDE_SECRET_KEY=${process.env.AMPLITUDE_SECRET_KEY ? 'SET' : 'NOT SET'}`);
    throw new Error(errorMsg);
  }

  const region = (argv["amplitude-region"] as 'us' | 'eu') || (process.env.AMPLITUDE_REGION as 'us' | 'eu') || 'us';

  return { apiKey, secretKey, region };
};

export const getProjectDir = (): string | undefined => {
  return (argv["project-dir"] as string) || process.env.AMPLITUDE_PROJECT_DIR || undefined;
};
