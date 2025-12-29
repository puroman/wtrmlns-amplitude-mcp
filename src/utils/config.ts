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
  .help()
  .argv;

/**
 * Get Amplitude API credentials from command line arguments or environment
 * Priority: command line args > environment variables
 * @returns Amplitude credentials object
 */
export const getAmplitudeCredentials = (): AmplitudeCredentials => {
  // Try command line args first, fall back to environment variables
  const apiKey = (argv["amplitude-api-key"] as string) || process.env.AMPLITUDE_API_KEY || "";
  const secretKey = (argv["amplitude-secret-key"] as string) || process.env.AMPLITUDE_SECRET_KEY || "";
  
  if (!apiKey || !secretKey) {
    console.error("Warning: Amplitude API credentials not provided via --amplitude-api-key/--amplitude-secret-key or AMPLITUDE_API_KEY/AMPLITUDE_SECRET_KEY environment variables");
  }
  
  // Get region from environment variable (defaults to 'us')
  const region = (process.env.AMPLITUDE_REGION as 'us' | 'eu' | undefined) || 'us';
  
  return { apiKey, secretKey, region };
};