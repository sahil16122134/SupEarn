/* ==========================================================================
   SupEarn — js/pages/admin.js
   Hidden admin login popup + admin panel. The panel is reachable only via
   the secret logo-tap gesture wired in main.js, and only ever renders
   real content once signInAdmin() has verified role:"admin" in Firestore.
   ========================================================================== */

import { appState } from "../core/state.js";
import { signInAdmin, signOutAdmin, AuthError } from "../core/auth.js";
import {
  subscribeAllPendingRedeemRequests,
  resolveRedeemRequestTx,
  updateSettings,
  getSettingsOnce,
  getTasksOnce,
  createTask,
  updateTask,
  deleteTask
} from "../core/firestore.js";
import { navigateTo } from "../core/router.js";
import { openModal, confirmModal } from "../components/modal.js";
import { showEmptyState } from "../components/empty-state.js";
import { cardListSkeleton } from "../components/skeleton.js";
import { formatDateShort } from "../core/utils.js";
import { toastSuccess, toastError } from "../services/toast.js";
import { hapticNotification, hapticSelection } from "../core/telegram.js";

/** Opens the hidden admin login popup. Called from main.js after the
 *  secret tap-and-hold gesture on the header logo completes. */
export function openAdminLoginModal() {
  openModal({
    cardClassName: "admin-login-card",
    bodyHtml: `
      <div class="admin-login-icon">
        <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 1L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-4z" fill="currentColor"/></svg>
      </div>
      <h3>Admin Login</h3>
      <div class="field">
        <label for="admin-email-input">Email</label>
        <input type="email" id="admin-email-input" autocomplete="off" />
      </div>
      <div class="field">
        <label for="admin-password-input">Password</label>
        <input type="password" id="admin-password-input" autocomplete="off" />
        <div class="field-error" id="admin-login-error"></div>
      </div>
      <button type="button" class="btn-glass btn-primary" id="admin-login-submit" style="width:100%;">Sign In</button>
    `,
    onMount: (card, close) => {
      const emailInput = card.querySelector("#admin-email-input");
      const passwordInput = card.querySelector("#admin-password-input");
      const errorEl = card.querySelector("#admin-login-error");
      const submitBtn = card.querySelector("#admin-login-submit");

      submitBtn.addEventListener("click", async () => {
        errorEl.textContent = "";
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        if (!email || !password) {
          errorEl.textContent = "Enter both email and password.";
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span>';

        try {
          await signInAdmin(email, password);
          appState.set("isAdmin", true);
          hapticNotification("success");
          close();
          navigateTo("admin");
        } catch (err) {
          hapticNotification("error");
          submitBtn.disabled = false;
          submitBtn.textContent = "Sign In";
          errorEl.textContent = err instanceof AuthError ? err.message : "Sign in failed. Please try again.";
        }
      });
    },
  });
}

export async function render(container) {
  if (!appState.get("isAdmin")) {
    container.innerHTML = `
      <div class="glass-card" style="text-align:center; padding:40px 20px;">
        <h3 style="margin-bottom:8px;">Access Denied</h3>
        <p>You need to sign in as an admin to view this page.</p>
      </div>
    `;
    return () => {};
  }
let currentTab = "dashboard";
let unsubRequests = null;

container.innerHTML = `
<div class="admin-page">

<div class="admin-topbar">
    <div>
        <h2>Admin Panel</h2>
        <small>SupEarn Management</small>
    </div>

    <button
        class="btn-glass btn-danger"
        id="admin-signout-btn">
        Sign Out
    </button>
</div>

<div class="admin-dashboard">

<div class="glass-card admin-stat-card">
<h3 id="statTasks">0</h3>
<p>Total Tasks</p>
</div>

<div class="glass-card admin-stat-card">
<h3 id="statActive">0</h3>
<p>Active</p>
</div>

<div class="glass-card admin-stat-card">
<h3 id="statHidden">0</h3>
<p>Hidden</p>
</div>

<div class="glass-card admin-stat-card">
<h3 id="statPending">0</h3>
<p>Redeem Requests</p>
</div>

</div>

<div class="admin-tabs">

<button
class="admin-tab-btn active"
data-admin-tab="tasks">
Tasks
</button>

<button
class="admin-tab-btn"
data-admin-tab="requests">
Requests
</button>

<button
class="admin-tab-btn"
data-admin-tab="settings">
Settings
</button>

</div>

<div id="admin-tab-content"></div>

</div>
`;

const tabContent =
container.querySelector("#admin-tab-content");

container
.querySelector("#admin-signout-btn")
.onclick = async () => {

const ok = await confirmModal({
title:"Sign Out",
message:"Sign out of admin panel?",
confirmLabel:"Sign Out",
danger:true
});

if(!ok) return;

await signOutAdmin();

appState.set("isAdmin",false);

navigateTo("home",{},{
isTab:true
});

};

container
.querySelectorAll("[data-admin-tab]")
.forEach(btn=>{

btn.onclick=()=>{

hapticSelection();

currentTab=btn.dataset.adminTab;

container
.querySelectorAll("[data-admin-tab]")
.forEach(b=>
b.classList.toggle(
"active",
b===btn
));

renderTab();

};

});

async function loadDashboardStats(){

try{

const tasks=
await getTasksOnce();

document.getElementById("statTasks").textContent=
tasks.length;

document.getElementById("statActive").textContent=
tasks.filter(t=>t.active!==false).length;

document.getElementById("statHidden").textContent=
tasks.filter(t=>t.hidden===true).length;

}catch(e){

console.error(e);

}

}

function renderTab(){

if(unsubRequests){

unsubRequests();

unsubRequests=null;

}

switch(currentTab){

case "tasks":

renderTasksTab();

break;

case "requests":

renderRequestsTab();

break;

case "settings":

renderSettingsTab();

break;

}

}

loadDashboardStats();

renderTab();
   container.innerHTML = `
<div class="admin-page">

    <div class="tasks-header-row">
        <h3>Admin Panel</h3>

        <button
            class="btn-glass btn-sm btn-ghost"
            id="admin-signout-btn">
            Sign Out
        </button>
    </div>

    <div class="admin-tabs">

        <button
            class="admin-tab-btn active"
            data-admin-tab="requests">
            Requests
        </button>

        <button
            class="admin-tab-btn"
            data-admin-tab="tasks">
            Tasks
        </button>

        <button
            class="admin-tab-btn"
            data-admin-tab="settings">
            Settings
        </button>

    </div>

    <div id="admin-tab-content"></div>

</div>
`;

const tabContent =
container.querySelector("#admin-tab-content");


container
.querySelector("#admin-signout-btn")
.addEventListener("click", async () => {

    const ok = await confirmModal({

        title: "Sign Out",
        message: "Sign out from Admin Panel?",
        confirmLabel: "Sign Out",
        danger: true

    });

    if (!ok) return;

    await signOutAdmin();

    appState.set("isAdmin", false);

    navigateTo("home", {}, { isTab: true });

});


container
.querySelectorAll("[data-admin-tab]")
.forEach(btn => {

    btn.onclick = () => {

        hapticSelection();

        currentTab = btn.dataset.adminTab;

        container
        .querySelectorAll("[data-admin-tab]")
        .forEach(b =>
            b.classList.toggle("active", b === btn)
        );

        renderTab();

    };

});


function renderTab() {

    if (unsubRequests) {

        unsubRequests();
        unsubRequests = null;

    }

    switch (currentTab) {

        case "requests":
            renderRequestsTab();
            break;

        case "tasks":
            renderTasksTab();
            break;

        case "settings":
            renderSettingsTab();
            break;

    }

}
  function renderRequestsTab() {
    tabContent.innerHTML = cardListSkeleton(3, "120px");

    unsubRequests = subscribeAllPendingRedeemRequests(
      (requests) => {
        if (requests.length === 0) {
          showEmptyState(tabContent, {
            type: "redeem",
            title: "No Pending Requests",
            message: "There are no redeem requests waiting for review right now.",
          });
          return;
        }

        tabContent.innerHTML = requests
          .map(
            (req) => `
          <div class="glass-card admin-request-card" data-request-id="${req.id}" style="margin-bottom:12px;">
            <div class="admin-request-header">
              <img class="admin-request-avatar" src="${escapeAttr(req.profilePhoto || "assets/icons/user-placeholder.svg")}" alt="" onerror="this.src='assets/icons/user-placeholder.svg'" />
              <div class="admin-request-user">
                <div class="admin-request-username">${escapeHtml(req.username ? "@" + req.username : "Unknown user")}</div>
                <div class="admin-request-id">ID: ${escapeHtml(req.telegramId)}</div>
              </div>
              <span class="badge badge-warning">Pending</span>
            </div>
            <div class="admin-request-details">
              <div class="admin-request-detail-row"><span>Type</span><span>${req.redeemType === "upi" ? "UPI" : "Gift Card"}</span></div>
              <div class="admin-request-detail-row"><span>Amount</span><span>${req.amount} coins</span></div>
              ${req.redeemType === "upi" ? `<div class="admin-request-detail-row"><span>UPI ID</span><span>${escapeHtml(req.upiId || "")}</span></div>` : ""}
              ${req.redeemType === "giftcard" ? `<div class="admin-request-detail-row"><span>Brand</span><span>${escapeHtml(req.giftCardBrand || "")}</span></div>` : ""}
              ${req.redeemType === "giftcard" ? `<div class="admin-request-detail-row"><span>Email</span><span>${escapeHtml(req.email || "")}</span></div>` : ""}
              <div class="admin-request-detail-row"><span>Date</span><span>${formatDateShort(req.createdAt)}</span></div>
            </div>
            <div class="admin-request-actions">
              <button type="button" class="btn-glass btn-danger btn-sm" data-reject>Reject</button>
              <button type="button" class="btn-glass btn-primary btn-sm" data-approve>Approve</button>
            </div>
          </div>
        `
          )
          .join("");

        requests.forEach((req) => {
          const card = tabContent.querySelector(`[data-request-id="${req.id}"]`);
          if (!card) return;
          card.querySelector("[data-approve]").addEventListener("click", () => handleResolve(req, true));
          card.querySelector("[data-reject]").addEventListener("click", () => handleResolve(req, false));
        });
      },
      () => {
        showEmptyState(tabContent, {
          type: "search",
          title: "Couldn't Load Requests",
          message: "There was a problem loading redeem requests.",
          retryLabel: "Retry",
          onRetry: renderRequestsTab,
        });
      }
    );
  }

  async function handleResolve(req, approve) {
    const confirmed = await confirmModal({
      title: approve ? "Approve Request" : "Reject Request",
      message: approve
        ? `Approve this ${req.amount}-coin redeem request for ${req.username ? "@" + req.username : req.telegramId}? This cannot be undone.`
        : `Reject this request and refund ${req.amount} coins to the user?`,
      confirmLabel: approve ? "Approve" : "Reject",
      danger: !approve,
    });
    if (!confirmed) return;

    try {
      // Balance updates always go through the requester's firebaseUid —
      // req.telegramId above is display-only data on the request document.
      await resolveRedeemRequestTx(req.id, req.firebaseUid, approve, approve ? 0 : req.amount);
      toastSuccess(approve ? "Request approved" : "Request rejected and refunded");
      hapticNotification("success");
    } catch (err) {
      hapticNotification("error");
      toastError("Couldn't process this request. Please try again.");
    }
  }
async function renderTasksTab() {

    tabContent.innerHTML = `
        <div class="tasks-header-row">
            <h3>Manage Tasks</h3>

            <button
                class="btn-glass btn-primary"
                id="addTaskBtn">
                + Add Task
            </button>
        </div>

        <div id="taskList">
            ${cardListSkeleton(4)}
        </div>
    `;

    const list = tabContent.querySelector("#taskList");

    let tasks = await getTasksOnce();

    if (!tasks.length) {
        showEmptyState(list,{
            title:"No Tasks",
            message:"No tasks created."
        });

        tabContent.querySelector("#addTaskBtn").onclick=()=>openTaskModal();

        return;
    }

    tasks.sort((a,b)=>{

        if(a.order===undefined) return 1;
        if(b.order===undefined) return -1;

        return a.order-b.order;

    });

    list.innerHTML=tasks.map(task=>`

<div class="glass-card" style="margin-bottom:12px;">

<div style="display:flex;justify-content:space-between;align-items:center;">

<div>

<h4>${escapeHtml(task.name)}</h4>

<div style="font-size:13px;color:#999;">
${task.reward} Coins
</div>

<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;">

<span class="badge ${task.active ? "badge-success":"badge-danger"}">
${task.active ? "Active":"Inactive"}
</span>

<span class="badge ${task.hidden ? "badge-warning":"badge-success"}">
${task.hidden ? "Hidden":"Visible"}
</span>

</div>

</div>

<div style="display:flex;gap:6px;flex-wrap:wrap;">

<button
class="btn-glass btn-sm"
data-toggle-active="${task.id}">
${task.active ? "Disable":"Enable"}
</button>

<button
class="btn-glass btn-sm"
data-toggle-hidden="${task.id}">
${task.hidden ? "Show":"Hide"}
</button>

<button
class="btn-glass btn-sm"
data-edit="${task.id}">
Edit
</button>

<button
class="btn-glass btn-danger btn-sm"
data-delete="${task.id}">
Delete
</button>

</div>

</div>

</div>

`).join("");

    tabContent.querySelector("#addTaskBtn").onclick=()=>openTaskModal();
tasks.forEach(task => {

    list.querySelector(`[data-edit="${task.id}"]`).onclick = () => openTaskModal(task);

    list.querySelector(`[data-delete="${task.id}"]`).onclick = () => deleteTaskHandler(task);

    list.querySelector(`[data-active="${task.id}"]`).onclick = async () => {

        await updateTask(task.id, {
            active: !task.active
        });

        toastSuccess(task.active ? "Task deactivated" : "Task activated");

        renderTasksTab();

    };

    list.querySelector(`[data-hide="${task.id}"]`).onclick = async () => {

        await updateTask(task.id, {
            hidden: !task.hidden
        });

        toastSuccess(task.hidden ? "Task visible" : "Task hidden");

        renderTasksTab();

    };

});
   async function deleteTaskHandler(task){

    const ok = await confirmModal({
        title:"Delete Task",
        message:`Delete "${task.name}" ?`,
        confirmLabel:"Delete",
        danger:true
    });

    if(!ok) return;

    await deleteTask(task.id);

    toastSuccess("Task deleted");

    renderTasksTab();

}
async function openTaskModal(task = null) {

  const isEdit = !!task;

  openModal({

    title: isEdit ? "Edit Task" : "Add Task",

    bodyHtml: `

      <div class="field">
        <label>Task Name</label>
        <input id="taskName" value="${task?.name || ""}">
      </div>

      <div class="field">
        <label>Reward</label>
        <input id="taskReward" type="number" value="${task?.reward || ""}">
      </div>

      <div class="field">
        <label>Description</label>
        <textarea id="taskDescription">${task?.description || ""}</textarea>
      </div>

      <div class="field">
        <label>Task URL</label>
        <input id="taskUrl" value="${task?.taskUrl || ""}">
      </div>

      <div class="field">
        <label>Icon URL</label>
        <input id="taskIcon" value="${task?.icon || ""}">
      </div>

      <div class="field">
        <label>Referral Code</label>
        <input id="taskReferral" value="${task?.referralCode || ""}">
      </div>

      <div class="field">
        <label>Notes</label>
        <textarea id="taskNotes">${task?.notes || ""}</textarea>
      </div>

      <div class="field">
        <label>Steps (one per line)</label>
        <textarea id="taskSteps">${(task?.steps || []).join("\n")}</textarea>
      </div>
<div class="field">
<label>
<input
type="checkbox"
id="taskActive"
${task?.active !== false ? "checked" : ""}>
Task Active
</label>
</div>

<div class="field">
<label>
<input
type="checkbox"
id="taskHidden"
${task?.hidden ? "checked" : ""}>
Hide Task
</label>
</div>
      <div class="field">
        <label>Status</label>
        <select id="taskStatus">
            <option value="true" ${task?.active !== false ? "selected" : ""}>
                Active
            </option>

            <option value="false" ${task?.active === false ? "selected" : ""}>
                Hidden
            </option>
        </select>
      </div>

      <button
          id="saveTaskBtn"
          class="btn-glass btn-primary"
          style="width:100%;margin-top:20px;">

          ${isEdit ? "Update Task" : "Create Task"}

      </button>

    `,

    onMount(card){

        card.querySelector("#saveTaskBtn").onclick = () => {

            saveTask(task);

        };

    }

  });

}
async function saveTask(existingTask = null) {

    const name = document.getElementById("taskName").value.trim();
    const reward = Number(document.getElementById("taskReward").value);

    const description = document.getElementById("taskDescription").value.trim();
    const taskUrl = document.getElementById("taskUrl").value.trim();
    const icon = document.getElementById("taskIcon").value.trim();
    const referralCode = document.getElementById("taskReferral").value.trim();
    const notes = document.getElementById("taskNotes").value.trim();

    const active =
        document.getElementById("taskStatus").value === "true";

    const steps = document
        .getElementById("taskSteps")
        .value
        .split("\n")
        .map(s => s.trim())
        .filter(Boolean);
const active =
    document.getElementById("taskActive").checked;

const hidden =
    document.getElementById("taskHidden").checked;
    if (!name) {
        toastError("Enter task name");
        return;
    }

    if (!reward || reward <= 0) {
        toastError("Enter valid reward");
        return;
    }

const data = {
    name,
    reward,
    description,
    taskUrl,
    icon,
    referralCode,
    notes,
    steps,
    active,
    hidden
};
    try {

        if (existingTask) {

            await updateTask(existingTask.id, data);

            toastSuccess("Task updated");

        } else {

            data.createdAt = Date.now();
            data.sortOrder = Date.now();

            await createTask(data);

            toastSuccess("Task created");

        }

        document.querySelector(".modal-overlay")?.remove();

        renderTasksTab();

    } catch (err) {

        console.error(err);

        toastError("Couldn't save task.");

    }

}
  async function renderSettingsTab() {
    tabContent.innerHTML = cardListSkeleton(2, "200px");
    const settings = await getSettingsOnce();

    tabContent.innerHTML = `
      <div class="glass-card admin-settings-group">
        <h4>Rewards</h4>
        <div class="field">
          <label>Watch Ad Reward (coins)</label>
          <input type="number" id="s-watchReward" value="${settings.watchRewardCoins}" />
        </div>
        <div class="field">
          <label>Daily Rewards, Day 1–7 (comma separated)</label>
          <input type="text" id="s-dailyRewards" value="${(settings.dailyRewardCoins || []).join(",")}" />
        </div>
        <div class="field">
          <label>Referral Bonus (coins)</label>
          <input type="number" id="s-referralBonus" value="${settings.referralBonusCoins}" />
        </div>
        <div class="field">
          <label>Referral Tasks Required</label>
          <input type="number" id="s-referralTasksRequired" value="${settings.referralTasksRequired}" />
        </div>
      </div>

      <div class="glass-card admin-settings-group">
        <h4>Economy &amp; Redeem</h4>
        <div class="field">
          <label>Coins per ₹1</label>
          <input type="number" id="s-coinPerRupee" value="${settings.coinPerRupee}" />
        </div>
        <div class="field">
          <label>Minimum UPI Redeem (coins)</label>
          <input type="number" id="s-minUpi" value="${settings.minimumUpiRedeem}" />
        </div>
        <div class="field">
          <label>Amazon Gift Card Minimum (coins)</label>
          <input type="number" id="s-gcAmazon" value="${(settings.giftCardMinimums || {}).amazon || 0}" />
        </div>
        <div class="field">
          <label>Flipkart Gift Card Minimum (coins)</label>
          <input type="number" id="s-gcFlipkart" value="${(settings.giftCardMinimums || {}).flipkart || 0}" />
        </div>
        <div class="field">
          <label>Myntra Gift Card Minimum (coins)</label>
          <input type="number" id="s-gcMyntra" value="${(settings.giftCardMinimums || {}).myntra || 0}" />
        </div>
      </div>

      <div class="glass-card admin-settings-group">
        <h4>Ads &amp; Tasks</h4>
        <div class="field">
          <label>Monetag Rewarded Zone ID</label>
          <input type="text" id="s-rewardedAdId" value="${escapeAttr(settings.rewardedAdId || "")}" />
        </div>
        <div class="field">
          <label>TADS Banner Ad Unit ID</label>
          <input type="text" id="s-bannerAdId" value="${escapeAttr(settings.bannerAdId || "")}" />
        </div>
        <div class="field">
          <label>AdsGram Task Block ID</label>
          <input type="text" id="s-adsgramBlockId" value="${escapeAttr(settings.adsgramBlockId || "")}" />
        </div>
        <div class="field">
          <label>Adeasly API Key</label>
          <input type="text" id="s-adeaslyApiKey" value="${escapeAttr(settings.adeaslyApiKey || "")}" />
        </div>
        <div class="field">
          <label>Watch Ad Cooldown (seconds)</label>
          <input type="number" id="s-cooldown" value="${settings.watchCooldownSeconds}" />
        </div>
        <div class="field">
          <label>Popup Auto-Close (seconds)</label>
          <input type="number" id="s-popupClose" value="${settings.popupCloseSeconds}" />
        </div>
      </div>

      <div class="admin-settings-save-bar">
        <button type="button" class="btn-glass btn-primary" id="admin-save-settings-btn">Save Settings</button>
      </div>
    `;

    tabContent.querySelector("#admin-save-settings-btn").addEventListener("click", async () => {
      const btn = tabContent.querySelector("#admin-save-settings-btn");
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span>';

      const dailyRewards = tabContent
        .querySelector("#s-dailyRewards")
        .value.split(",")
        .map((v) => parseInt(v.trim(), 10) || 0);

      const payload = {
        watchRewardCoins: parseInt(tabContent.querySelector("#s-watchReward").value, 10) || 0,
        dailyRewardCoins: dailyRewards.length === 7 ? dailyRewards : settings.dailyRewardCoins,
        referralBonusCoins: parseInt(tabContent.querySelector("#s-referralBonus").value, 10) || 0,
        referralTasksRequired: parseInt(tabContent.querySelector("#s-referralTasksRequired").value, 10) || 0,
        coinPerRupee: parseInt(tabContent.querySelector("#s-coinPerRupee").value, 10) || 1,
        minimumUpiRedeem: parseInt(tabContent.querySelector("#s-minUpi").value, 10) || 0,
        giftCardMinimums: {
          amazon: parseInt(tabContent.querySelector("#s-gcAmazon").value, 10) || 0,
          flipkart: parseInt(tabContent.querySelector("#s-gcFlipkart").value, 10) || 0,
          myntra: parseInt(tabContent.querySelector("#s-gcMyntra").value, 10) || 0,
        },
        rewardedAdId: tabContent.querySelector("#s-rewardedAdId").value.trim(),
        bannerAdId: tabContent.querySelector("#s-bannerAdId").value.trim(),
        adsgramBlockId: tabContent.querySelector("#s-adsgramBlockId").value.trim(),
        adeaslyApiKey: tabContent.querySelector("#s-adeaslyApiKey").value.trim(),
        watchCooldownSeconds: parseInt(tabContent.querySelector("#s-cooldown").value, 10) || 0,
        popupCloseSeconds: parseInt(tabContent.querySelector("#s-popupClose").value, 10) || 0,
      };

      try {
        await updateSettings(payload);
        toastSuccess("Settings saved");
        hapticNotification("success");
      } catch (err) {
        toastError("Couldn't save settings. Please try again.");
        hapticNotification("error");
      } finally {
        btn.disabled = false;
        btn.textContent = "Save Settings";
      }
    });
  }

  renderTab();

  return () => {
    if (unsubRequests) unsubRequests();
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
