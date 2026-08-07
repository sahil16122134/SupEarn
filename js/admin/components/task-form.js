import { createTask, updateTask } from "../../core/firestore.js";

export async function openTaskForm(task = null) {

  const name = prompt("Task Name", task?.name || "");
  if (name === null) return;

  const reward = Number(prompt("Reward Coins", task?.reward || 100));
  if (!reward) return;

  const description = prompt("Description", task?.description || "") || "";

  const stepsText = prompt(
    "Steps (one step per line)",
    (task?.steps || []).join("\n")
  ) || "";

  const notes = prompt("Notes (optional)", task?.notes || "") || "";

  const referralCode = prompt(
    "Referral Code (optional)",
    task?.referralCode || ""
  ) || "";

  const taskUrl = prompt(
    "Task URL",
    task?.taskUrl || "https://"
  ) || "";

  const icon = prompt(
    "Icon URL",
    task?.icon || ""
  ) || "";

  const data = {

    name,

    reward,

    description,

    steps: stepsText
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean),

    notes,

    referralCode,

    taskUrl,

    icon,

    active: true,

    updatedAt: Date.now()

  };

  if (task) {

    await updateTask(task.id, data);

  } else {

    data.createdAt = Date.now();

    await createTask(data);

  }

}
