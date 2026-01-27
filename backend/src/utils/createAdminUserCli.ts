import { input, password } from "@inquirer/prompts";
import { createAdminUser } from "./createAdminUser";
import { generateTokens } from "../middleware/auth";

const requireNonEmpty = (value: string): true | string =>
  value.trim().length > 0 ? true : "This value is required.";

const promptForAdminDetails = async (): Promise<{
  email: string;
  name?: string;
  password: string;
}> => {
  const email = await input({
    message: "Admin email:",
    validate: requireNonEmpty,
  });

  const name = await input({
    message: "Admin name (optional):",
    default: "",
  });

  const adminPassword = await password({
    message: "Admin password:",
    mask: "*",
    validate: requireNonEmpty,
  });

  const confirmPassword = await password({
    message: "Confirm admin password:",
    mask: "*",
    validate: requireNonEmpty,
  });

  if (adminPassword !== confirmPassword) {
    throw new Error("Passwords do not match.");
  }

  return {
    email: email.trim(),
    name: name.trim() || undefined,
    password: adminPassword,
  };
};

export async function runCreateAdminUserCli(): Promise<void> {
  const {
    email,
    name,
    password: adminPassword,
  } = await promptForAdminDetails();

  process.env.ADMIN_USER_EMAIL = email;
  process.env.ADMIN_USER_PASSWORD = adminPassword;

  if (name) {
    process.env.ADMIN_USER_NAME = name;
  } else {
    delete process.env.ADMIN_USER_NAME;
  }

  const { user } = await createAdminUser();
  console.log(`User tokens:`);
  console.log(generateTokens(user));
}

if (require.main === module) {
  runCreateAdminUserCli()
    .then(() => process.exit(0))
    .catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`❌ Admin CLI failed: ${message}`);
      process.exit(1);
    });
}
