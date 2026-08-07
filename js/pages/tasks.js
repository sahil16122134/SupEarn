/* ==========================================================================
   SupEarn — js/pages/tasks.js
   Tasks screen. Loads tasks from AdsGram and Adeasly, normalizes them into
   a shared card shape, and drives each card's action button purely off
   the provider-reported status — never a hardcoded label. Successful task
   rewards also advance this user's progress toward paying out anyone who
   referred them.
   ========================================================================== */

import { appState } from "../core/state.js";
import {
  creditTaskRewardOnceTx,
  isTaskAlreadyRewarded,
  incrementReferralTaskProgressTx,
  getTasksOnce,
  markCustomTaskCompleted
} from "../core/firestore.js";
import { getAdsgramTaskEntries, startAdsgramTask } from "../services/adsgram.js";
import { fetchAdeaslyTasks, getAdeaslyClickUrl } from "../services/adeasly.js";
import { isOnline, requireOnline, subscribeOnline } from "../services/network.js";
import { toastError, toastInfo, toastWarning } from "../services/toast.js";
import { taskListSkeleton } from "../components/skeleton.js";
import { showEmptyState } from "../components/empty-state.js";
import { wireExpandable } from "../components/ui.js";
import { openModal } from "../components/modal.js";
import { triggerConfetti } from "../components/confetti.js";
import { flyCoinsToWallet } from "../components/coin-fly.js";
import { renderBannerAd } from "../services/ads-tads.js";
import { openExternalLink, hapticSelection, hapticNotification } from "../core/telegram.js";

const STATUS_LABELS = {
  start: "Start",
  continue: "Continue",
  claim: "Claim",
  completed: "Completed",
  disabled: "Disabled",
};

export async function render(container) {
  let allTasks = [];
  let currentFilter = "all";
  let isBusy = false;

  container.innerHTML = `
    <div class="tasks-header-row">
      <h3>Tasks</h3>
    </div>
    <div class="tasks-filter-row" id="tasks-filter-row">
      <button type="button" class="filter-chip active" data-filter="all">All</button>
      <button type="button" class="filter-chip" data-filter="SupEarn">SupEarn</button>
      <button type="button" class="filter-chip" data-filter="AdsGram">AdsGram</button>
      <button type="button" class="filter-chip" data-filter="Adeasly">Adeasly</button>
    </div>
    <div class="task-list" id="task-list">${taskListSkeleton(5)}</div>
  `;

  const listEl = container.querySelector("#task-list");
  const filterRow = container.querySelector("#tasks-filter-row");

  filterRow.addEventListener("click", (e) => {
    const chip = e.target.closest(".filter-chip");
    if (!chip) return;
    hapticSelection();
    filterRow.querySelectorAll(".filter-chip").forEach((c) => c.classList.toggle("active", c === chip));
    currentFilter = chip.dataset.filter;
    renderList();
  });

  async function loadTasks() {
    listEl.innerHTML = taskListSkeleton(5);

    if (!isOnline()) {
      showEmptyState(listEl, {
        type: "offline",
        title: "No internet connection",
        message: "Tasks need an internet connection to load. Check your connection and try again.",
        retryLabel: "Retry",
        onRetry: loadTasks,
      });
      return;
    }

    const settings = appState.get("settings") || {};
    const telegramUser = appState.get("telegramUser") || {};
    const firebaseUid = appState.get("firebaseUid");
    const telegramId = telegramUser.telegramId;
     const user = appState.get("user") || {};
const completedCustomTasks = user.completedCustomTasks || {};

    let adsgramCompleted = false;
    if (settings.adsgramBlockId) {
      try {
        adsgramCompleted = await isTaskAlreadyRewarded(firebaseUid, `adsgram_${settings.adsgramBlockId}`);
      } catch (err) {
        adsgramCompleted = false;
      }
    }
   const adsgramTasks = getAdsgramTaskEntries(settings, adsgramCompleted);
const adeaslyTasks = await fetchAdeaslyTasks(settings.adeaslyApiKey, telegramId);

// ADD THESE TWO LINES
const completedCustomTasks =
    appState.get("appUser")?.completedCustomTasks || {};

const customTasks = await getTasksOnce();

// Admin tasks
const adminTasks = customTasks.map(task => ({
    id: task.id,
    provider: "SupEarn",
    title: task.name,
    reward: task.reward,
    description: task.description,
    steps: task.steps || [],
    notes: task.notes || "",
    referralCode: task.referralCode || "",
    taskUrl: task.taskUrl,
    iconUrl: task.icon,
    estimatedTime: "",
    status: completedCustomTasks[task.id]
        ? "completed"
        : "start",
    type: "custom"
}));

allTasks = [
    ...adminTasks,
    ...adsgramTasks,
    ...adeaslyTasks
];
    renderList();
  }

  function renderList() {
    const filtered = currentFilter === "all" ? allTasks : allTasks.filter((t) => t.provider === currentFilter);

    if (filtered.length === 0) {
      showEmptyState(listEl, {
        type: "tasks",
        title: "No Tasks Available",
        message: "There aren't any tasks to complete right now. Check back soon for new ways to earn.",
        retryLabel: "Retry",
        onRetry: loadTasks,
      });
      return;
    }

    listEl.innerHTML = filtered
      .map(
        (task, idx) => `
        <div class="glass-card task-card stagger-item" data-task-index="${idx}" style="animation-delay:${idx * 50}ms;">
          <div class="task-card-main" data-task-toggle>
            ${
              task.iconUrl
                ? `<img class="task-icon" src="${escapeAttr(task.iconUrl)}" alt="" loading="lazy" onerror="this.style.display='none'" />`
                : `<div class="task-icon-fallback">${escapeHtml(task.iconLetter || task.provider.charAt(0))}</div>`
            }
            <div class="task-body">
              <div class="task-title">${escapeHtml(task.title)}</div>
              <div class="task-meta-row">
                <span class="task-reward mono">+${task.reward || 0} coins</span>
                ${task.estimatedTime ? `<span class="task-time">${escapeHtml(task.estimatedTime)}</span>` : ""}
                <span class="task-provider-tag">${escapeHtml(task.provider)}</span>
              </div>
            </div>
            ${task.description ? `<svg class="expandable-chevron" viewBox="0 0 24 24" width="16" height="16"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>` : ""}
          </div>
          ${
            task.description
              ? `<div class="task-description"><div class="task-description-text">${escapeHtml(task.description)}</div></div>`
              : ""
          }
          <div style="margin-top:12px;">
            <button type="button" class="btn-glass task-action-btn state-${task.status}" data-task-action ${
          task.status === "completed" || task.status === "disabled" ? "disabled" : ""
        }>${STATUS_LABELS[task.status] || "Start"}</button>
          </div>
        </div>
      `
      )
      .join("");

    filtered.forEach((task, idx) => {
      const card = listEl.querySelector(`[data-task-index="${idx}"]`);
      if (!card) return;

      if (task.description) {
        const toggle = card.querySelector("[data-task-toggle]");
        wireExpandable(toggle, card, { openClass: "is-expanded" });
      }

      const actionBtn = card.querySelector("[data-task-action]");
      if (actionBtn && !actionBtn.disabled) {
        actionBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          handleTaskAction(task, actionBtn);
        });
      }
    });
  }

  async function handleTaskAction(task, buttonEl) {

  if (isBusy) return;
  if (!requireOnline()) return;

  // Custom admin task
  if (task.type === "custom") {
    showCustomTaskPopup(task);
    return;
  }

  if (task.provider === "AdsGram") {
    await handleAdsgramAction(task, buttonEl);
  } else if (task.provider === "Adeasly") {
    await handleAdeaslyAction(task, buttonEl);
  }

  }

  async function handleAdsgramAction(task, buttonEl) {
    isBusy = true;
    const originalLabel = buttonEl.textContent;
    buttonEl.textContent = "Loading…";
    buttonEl.disabled = true;

    const watched = await startAdsgramTask(task.blockId);

    if (!watched) {
      buttonEl.textContent = originalLabel;
      buttonEl.disabled = false;
      isBusy = false;
      toastError("Task unavailable right now. Please try again.");
      return;
    }

    await creditTaskReward(task, buttonEl, originalLabel);
  }

  async function handleAdeaslyAction(task, buttonEl) {
    if (task.status === "start" || task.status === "continue") {
      const url = getAdeaslyClickUrl(task);
      if (!url) {
        toastError("This task's link is unavailable right now.");
        return;
      }
      hapticSelection();
      openExternalLink(url);
      toastInfo("Complete the task, then come back and tap Claim.");
      return;
    }

    if (task.status === "claim") {
      isBusy = true;
      const originalLabel = buttonEl.textContent;
      buttonEl.textContent = "Claiming…";
      buttonEl.disabled = true;
      await creditTaskReward(task, buttonEl, originalLabel);
    }
  }

  async function creditTaskReward(task, buttonEl, originalLabel) {
    try {
      const firebaseUid = appState.get("firebaseUid");
      const telegramId = appState.get("telegramUser").telegramId;
      const settings = appState.get("settings") || {};

      await creditTaskRewardOnceTx(firebaseUid, telegramId, task.id, task.reward, task.provider);
if (task.type === "custom") {
  await markCustomTaskCompleted(firebaseUid, task.id);
}
      try {
        await incrementReferralTaskProgressTx(telegramId, settings.referralTasksRequired || 4);
      } catch (err) {
        // Referral progress is a bonus side-effect — never block the task reward on it.
      }

      hapticNotification("success");
      flyCoinsToWallet(buttonEl, document.getElementById("header-avatar"), 6);
      triggerConfetti(28);
      showRewardPopup(task.reward);

// Reload user data if your app has this function
// (otherwise just keep loadTasks())
await loadTasks();
    } catch (err) {
      if (err && err.message === "ALREADY_REWARDED") {
        toastWarning("This task has already been rewarded.");
        loadTasks();
      } else {
        hapticNotification("error");
        toastError("Couldn't credit your reward. Please try again.");
        buttonEl.textContent = originalLabel;
        buttonEl.disabled = false;
      }
    } finally {
      isBusy = false;
    }
  }

  function showRewardPopup(amount) {
    const settings = appState.get("settings") || {};
    openModal({
      autoCloseSeconds: settings.popupCloseSeconds || 5,
      bodyHtml: `
        <div style="text-align:center; padding-top:8px;">
          <div style="width:64px; height:64px; margin:0 auto 14px; border-radius:50%; background:var(--success-dim); display:flex; align-items:center; justify-content:center;">
            <svg viewBox="0 0 24 24" width="30" height="30"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="var(--success)"/></svg>
          </div>
          <h3 style="margin-bottom:6px;">Task Completed!</h3>
          <p style="margin-bottom:16px;">You earned <strong class="mono" style="color:var(--accent-gold);">+${amount} coins</strong></p>
          <div class="banner-ad-slot is-empty" id="task-popup-banner" style="min-height:60px;"></div>
        </div>
      `,
      onMount: (card) => {
        renderBannerAd(card.querySelector("#task-popup-banner"), settings.bannerAdId);
      },
    });
  }
function showCustomTaskPopup(task) {

  openModal({

    title: task.title,

    bodyHtml: `
      <div class="custom-task-popup">

        <p>${escapeHtml(task.description || "")}</p>

        ${
          (task.steps || []).length
          ? `
          <h4>Steps</h4>

          <ol>
            ${(task.steps || [])
  .map(step => `<li>${escapeHtml(step)}</li>`)
  .join("")}
          </ol>
          `
          : ""
        }

        ${
          task.notes
          ? `
          <div class="glass-card">
            <strong>Note</strong><br>
            ${escapeHtml(task.notes)}
          </div>
          `
          : ""
        }

        ${
          task.referralCode
          ? `
          <div class="glass-card">
            <strong>Referral Code</strong><br>
            <span class="mono">${escapeHtml(task.referralCode)}</span>
          </div>
          `
          : ""
        }

        <div style="margin-top:20px">

          <button
  id="customTaskStart"
  class="btn-glass btn-primary"
  ${task.status === "completed" ? "disabled" : ""}>

  ${
    task.status === "claim"
      ? "Claim Reward"
      : task.status === "completed"
      ? "Completed"
      : `Start Task (+${task.reward})`
  }

</button>

        </div>

      </div>
    `,

    onMount(card){

      card.querySelector("#customTaskStart").onclick = async () => {

    if (task.status === "completed") return;

    if (task.status === "claim") {
        await creditTaskReward(
            task,
            card.querySelector("#customTaskStart"),
            "Claim Reward"
        );
        return;
    }

    if (task.taskUrl) {
    openExternalLink(task.taskUrl);

    task.status = "claim";

    // Close popup
    document.querySelector(".modal-overlay")?.remove();

} else {
    toastError("Task URL not available.");
    }

};
    }
  });
  const unsubOnline = subscribeOnline((online) => {
    if (online) loadTasks();
  });
}
  await loadTasks();

  return () => {
    unsubOnline();
  };
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
