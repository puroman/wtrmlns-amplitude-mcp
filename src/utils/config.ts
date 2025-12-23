import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { AmplitudeCredentials } from "../types/amplitude.js";

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option("amplitude-api-key", {
    type: "string",
    description: "Amplitude API key",
    demandOption: true
  })
  .option("amplitude-secret-key", {
    type: "string",
    description: "Amplitude secret key",
    demandOption: true
  })
  .help()
  .argv;

/**
 * Get Amplitude API credentials from command line arguments and environment
 * @returns Amplitude credentials object
 */
export const getAmplitudeCredentials = (): AmplitudeCredentials => {
  const apiKey = argv["amplitude-api-key"] as string;
  const secretKey = argv["amplitude-secret-key"] as string;
  
  // Get region from environment variable (defaults to 'us')
  const region = (process.env.AMPLITUDE_REGION as 'us' | 'eu' | undefined) || 'us';
  
  return { apiKey, secretKey, region };
};