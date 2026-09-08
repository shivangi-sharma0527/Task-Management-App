const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const today = new Date();
const isoToday = () => new Date(Date.now() - new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const plusDays = n => { const d=new Date(); d.setDate(d.getDate()+n); return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10); };

let tasks = JSON.parse(localStorage.getItem("taskflow_tasks") || "null") || [
  {id:1,title:"Finalize portfolio website",description:"Polish responsive layout and deploy the latest version.",date:plusDays(0),priority:"high",status:"in-progress"},
  {id:2,title:"Complete DSA practice",description:"Solve two array and one graph problem.",date:plusDays(1),priority:"medium",status:"pending"},
  {id:3,title:"Prepare project presentation",description:"Finish slides and practice the product demo.",date:plusDays(3),priority:"high",status:"pending"},
  {id:4,title:"Review internship documentation",description:"Check the final documents before submission.",date:plusDays(-1),priority:"low",status:"completed"},
  {id:5,title:"Update GitHub README",description:"Add screenshots and setup instructions.",date:plusDays(4),priority:"low",status:"completed"}
];
let activeFilter="all", currentView="dashboard";

const save=()=>localStorage.setItem("taskflow_tasks",JSON.stringify(tasks));
const formatDate=d=>{if(d===isoToday())return"Today";if(d===plusDays(1))return"Tomorrow";const dt=new Date(d+"T00:00:00");return dt.toLocaleDateString("en-IN",{day:"2-digit",month:"short"});};
const escapeHtml=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const showToast=msg=>{const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)};

function taskMarkup(t){
  const done=t.status==="completed";
  return `<div class="task-row" data-id="${t.id}">
    <button class="check ${done?"done":""}" onclick="toggleTask(${t.id})">${done?"✓":""}</button>
    <div class="task-info"><p class="task-title ${done?"done-text":""}">${escapeHtml(t.title)}</p><div class="task-meta">${formatDate(t.date)} · ${escapeHtml(t.description||"No description")}</div></div>
    <span class="badge ${t.priority}">${t.priority}</span>
    <span class="badge status-badge">${t.status==="in-progress"?"In progress":t.status}</span>
    <div class="row-actions"><button title="Edit" onclick="editTask(${t.id})">✎</button><button title="Delete" onclick="deleteTask(${t.id})">×</button></div>
  </div>`;
}

function render(){
  const completed=tasks.filter(t=>t.status==="completed").length;
  const progress=tasks.filter(t=>t.status==="in-progress").length;
  const due=tasks.filter(t=>t.date===isoToday()&&t.status!=="completed").length;
  const rate=tasks.length?Math.round(completed/tasks.length*100):0;
  $("#completedStat").textContent=completed; $("#progressStat").textContent=progress; $("#todayStat").textContent=due;
  $("#productivityStat").textContent=rate+"%"; $("#completedRate").textContent=rate+"% of total"; $("#allCount").textContent=tasks.length;
  $("#legendDone").textContent=completed; $("#legendPending").textContent=tasks.length-completed; $("#donutValue").textContent=rate+"%";
  $("#donut").style.background=`conic-gradient(var(--primary) ${rate*3.6}deg, ${document.body.classList.contains("dark")?"#303545":"#edf0f5"} 0deg)`;

  let visible=tasks.filter(t=>activeFilter==="all"||t.status===activeFilter);
  const query=$("#searchInput").value.toLowerCase().trim();
  if(query) visible=visible.filter(t=>(t.title+" "+t.description).toLowerCase().includes(query));
  const pf=$("#priorityFilter").value;
  if(pf!=="all") visible=visible.filter(t=>t.priority===pf);

  $("#taskList").innerHTML=visible.slice().sort((a,b)=>a.date.localeCompare(b.date)).slice(0,6).map(taskMarkup).join("");
  $("#fullTaskList").innerHTML=visible.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(taskMarkup).join("");
  $("#emptyState").classList.toggle("hidden",visible.length>0);
}

function switchView(view){
  currentView=view;
  $("#dashboardView").classList.toggle("hidden",view!=="dashboard");
  $("#tasksView").classList.toggle("hidden",view==="dashboard");
  $("#pageTitle").textContent=view==="dashboard"?"Good morning 👋":view==="today"?"Today's tasks":view==="completed"?"Completed tasks":"All tasks";
  if(view==="today"){activeFilter="all";$("#searchInput").value="";} 
  if(view==="completed")activeFilter="completed";
  if(view==="tasks")activeFilter="all";
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".filter").forEach(b=>b.classList.toggle("active",b.dataset.filter===activeFilter));
  render();
}
function openModal(task=null){
  $("#taskModal").classList.remove("hidden");
  $("#modalTitle").textContent=task?"Edit task":"Create a new task";
  $("#taskId").value=task?.id||"";
  $("#taskTitle").value=task?.title||"";
  $("#taskDescription").value=task?.description||"";
  $("#taskDate").value=task?.date||isoToday();
  $("#taskPriority").value=task?.priority||"medium";
  $("#taskStatus").value=task?.status||"pending";
  $("#taskTitle").focus();
}
function closeModal(){$("#taskModal").classList.add("hidden")}
function editTask(id){openModal(tasks.find(t=>t.id===id))}
function deleteTask(id){if(confirm("Delete this task?")){tasks=tasks.filter(t=>t.id!==id);save();render();showToast("Task deleted")}}
function toggleTask(id){const t=tasks.find(t=>t.id===id);t.status=t.status==="completed"?"pending":"completed";save();render();showToast(t.status==="completed"?"Task completed ✓":"Task moved to pending")}

const getUsers=()=>JSON.parse(localStorage.getItem("taskflow_users")||"[]");
const saveUsers=u=>localStorage.setItem("taskflow_users",JSON.stringify(u));
const enterApp=()=>{$("#authScreen").classList.add("hidden");$("#appScreen").classList.remove("hidden");$("#dateLabel").textContent=today.toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});render()};

$("#loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const email=$("#email").value.trim().toLowerCase(), password=$("#password").value;
  const users=getUsers();
  const user=users.find(u=>u.email===email);
  if(users.length && (!user || user.password!==password)){showToast("Invalid email or password");return}
  if(!users.length){showToast("No account found — create one first");return}
  enterApp();
});

$("#togglePassword").onclick=()=>{
  const p=$("#password");p.type=p.type==="password"?"text":"password";
  $("#togglePassword").textContent=p.type==="password"?"Show":"Hide";
};

$("#showSignup").onclick=()=>{
  $("#loginForm").parentElement.classList.add("hidden");
  $("#signupPanel").classList.remove("hidden");
  $("#signupName").focus();
};

$("#showLogin").onclick=()=>{
  $("#signupPanel").classList.add("hidden");
  $("#loginForm").parentElement.classList.remove("hidden");
  $("#email").focus();
};

$("#toggleSignupPassword").onclick=()=>{
  const p=$("#signupPassword");p.type=p.type==="password"?"text":"password";
  $("#toggleSignupPassword").textContent=p.type==="password"?"Show":"Hide";
};

$("#toggleConfirmPassword").onclick=()=>{
  const p=$("#signupConfirm");p.type=p.type==="password"?"text":"password";
  $("#toggleConfirmPassword").textContent=p.type==="password"?"Show":"Hide";
};

$("#signupForm").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("#signupName").value.trim();
  const email=$("#signupEmail").value.trim().toLowerCase();
  const password=$("#signupPassword").value;
  const confirm=$("#signupConfirm").value;
  const users=getUsers();

  if(password!==confirm){showToast("Passwords do not match");return}
  if(users.some(u=>u.email===email)){showToast("An account with this email already exists");return}

  users.push({name,email,password});
  saveUsers(users);
  $("#signupForm").reset();
  $("#signupPanel").classList.add("hidden");
  $("#loginForm").parentElement.classList.remove("hidden");
  $("#email").value=email;
  $("#password").value="";
  showToast("Account created successfully ✓");
  $("#password").focus();
});
$("#logoutBtn").onclick=()=>{$("#appScreen").classList.add("hidden");$("#authScreen").classList.remove("hidden");showToast("Logged out successfully")};
$("#addTaskBtn").onclick=()=>openModal();$("#addTaskBtn2").onclick=()=>openModal();$("#openAddFromNav").onclick=()=>openModal();
$("#closeModal").onclick=closeModal;$("#cancelModal").onclick=closeModal;$(".modal-backdrop").onclick=closeModal;
$("#taskForm").addEventListener("submit",e=>{e.preventDefault();const id=$("#taskId").value;const data={id:id?Number(id):Date.now(),title:$("#taskTitle").value.trim(),description:$("#taskDescription").value.trim(),date:$("#taskDate").value,priority:$("#taskPriority").value,status:$("#taskStatus").value};if(id)tasks=tasks.map(t=>t.id===Number(id)?data:t);else tasks.unshift(data);save();render();closeModal();showToast(id?"Task updated ✓":"New task created ✓")});
$$(".nav-item[data-view]").forEach(b=>b.onclick=()=>switchView(b.dataset.view));
$$(".text-btn").forEach(b=>b.onclick=()=>switchView(b.dataset.view||"tasks"));
$$(".filter").forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
$("#priorityFilter").onchange=render;$("#searchInput").oninput=render;
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("taskflow_theme",document.body.classList.contains("dark")?"dark":"light");render()};
if(localStorage.getItem("taskflow_theme")==="dark")document.body.classList.add("dark");
$("#profileBtn").onclick=()=>showToast("Profile settings coming soon");
render();
