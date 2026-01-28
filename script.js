/**
 * PROPATH - Core Script
 * Organized by: Data, Initialization, Rendering, Management, and Utilities
 */

// --- 1. DATA & STATE ---
const dsaRoadmapData = [
    { title: "PHASE 0: Foundations", tasks: ["Complexity (Big-O)", "Math for DSA", "Recursion Basics"], completed: {} },
    { title: "PHASE 1: Arrays & Strings", tasks: ["Sliding Window", "Two Pointers", "Kadane's Algorithm"], completed: {} },
    { title: "PHASE 2: Searching & Sorting", tasks: ["Binary Search", "Merge Sort", "Quick Sort"], completed: {} },
    { title: "PHASE 3: Hashing", tasks: ["Frequency Counting", "Two Sum", "Longest Consecutive Sequence"], completed: {} },
    { title: "PHASE 4: Linked List", tasks: ["Reversing", "Cycle Detection", "Merge Two Lists"], completed: {} }
];

let courses = JSON.parse(localStorage.getItem('courses')) || [];
let activeCourseIndex = 0;
let currentInputCallback = null;

// --- 2. INITIALIZATION ---
function init() {
    if (courses.length === 0) {
        courses.push({ name: "DSA Mastery", data: JSON.parse(JSON.stringify(dsaRoadmapData)) });
    }
    renderSidebar();
    renderCourse();
    
    // Setup Modal Submit Listener
    const submitBtn = document.getElementById('input-modal-submit');
    if(submitBtn) submitBtn.onclick = handleInputSubmit;
}

// --- 3. RENDERING ENGINE ---

function renderSidebar() {
    const list = document.getElementById('course-list');
    if (!list) return;

    if (courses.length === 0) {
        list.innerHTML = `<li style="font-size: 0.8rem; color: var(--text-dim);">No courses yet</li>`;
        return;
    }

    list.innerHTML = courses.map((c, i) => `
        <li class="${i === activeCourseIndex ? 'active' : ''}" onclick="switchCourse(${i})">
            <div><i class="fas fa-book-open"></i> ${c.name}</div>
            <i class="fas fa-trash-alt delete-btn" onclick="event.stopPropagation(); deleteCourse(${i})"></i>
        </li>
    `).join('');
}

function renderCourse() {
    const course = courses[activeCourseIndex];
    const container = document.getElementById('roadmap-container');
    const titleEl = document.getElementById('active-course-title');
    
    if (!course || !container) return;

    titleEl.innerText = course.name;
    container.innerHTML = '';

    course.data.forEach((phase, pIdx) => {
        const card = document.createElement('div');
        card.className = 'phase-card';
        
        // Phase Header
        card.innerHTML = `
            <div class="phase-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1.5rem;">
                <h3 style="margin:0"><i class="fas fa-layer-group"></i> ${phase.title}</h3>
                <div class="phase-actions">
                    <i class="fas fa-edit action-icon" onclick="editPhase(${pIdx})"></i>
                    <i class="fas fa-trash action-icon delete" onclick="deletePhase(${pIdx})"></i>
                </div>
            </div>
        `;
        
        // Task List
        phase.tasks.forEach((task, tIdx) => {
            if (!phase.completed) phase.completed = {};
            const isDone = phase.completed[tIdx] || false;
            
            const item = document.createElement('div');
            item.className = `checklist-item ${isDone ? 'done' : ''}`;
            item.innerHTML = `
                <div style="display: flex; align-items: center; flex: 1;" onclick="toggleTask(${pIdx}, ${tIdx})">
                    <div class="custom-check"></div>
                    <span>${task}</span>
                </div>
                <div class="task-actions">
                    <i class="fas fa-pen action-icon" onclick="editTask(${pIdx}, ${tIdx})"></i>
                    <i class="fas fa-times action-icon delete" onclick="deleteTask(${pIdx}, ${tIdx})"></i>
                </div>
            `;
            card.appendChild(item);
        });

        // Add Task Button Footer
        const addBtn = document.createElement('button');
        addBtn.className = 'btn-add-task';
        addBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        addBtn.onclick = () => addTask(pIdx);
        card.appendChild(addBtn);

        container.appendChild(card);
    });
    updateProgress();
}

// --- 4. COURSE & TASK MANAGEMENT ---

function switchCourse(index) {
    activeCourseIndex = index;
    renderSidebar();
    renderCourse();
}

function deleteCourse(index) {
    if (confirm(`Delete "${courses[index].name}"?`)) {
        courses.splice(index, 1);
        activeCourseIndex = Math.max(0, activeCourseIndex - 1);
        saveAndRefresh();
        renderSidebar();
        if (courses.length === 0) resetMainUI();
    }
}

function toggleTask(pIdx, tIdx) {
    const phase = courses[activeCourseIndex].data[pIdx];
    if (!phase.completed) phase.completed = {};
    phase.completed[tIdx] = !phase.completed[tIdx];
    saveAndRefresh();
}

function addTask(pIdx) {
    openInputModal("Add New Task", "", (val) => {
        courses[activeCourseIndex].data[pIdx].tasks.push(val);
        saveAndRefresh();
    });
}

function editTask(pIdx, tIdx) {
    const current = courses[activeCourseIndex].data[pIdx].tasks[tIdx];
    openInputModal("Edit Task", current, (val) => {
        courses[activeCourseIndex].data[pIdx].tasks[tIdx] = val;
        saveAndRefresh();
    });
}

function deleteTask(pIdx, tIdx) {
    if (confirm("Delete this task?")) {
        courses[activeCourseIndex].data[pIdx].tasks.splice(tIdx, 1);
        if (courses[activeCourseIndex].data[pIdx].completed) {
            delete courses[activeCourseIndex].data[pIdx].completed[tIdx];
        }
        saveAndRefresh();
    }
}

function editPhase(pIdx) {
    const current = courses[activeCourseIndex].data[pIdx].title;
    openInputModal("Edit Phase Title", current, (val) => {
        courses[activeCourseIndex].data[pIdx].title = val;
        saveAndRefresh();
    });
}

function deletePhase(pIdx) {
    if (confirm("Delete this entire phase?")) {
        courses[activeCourseIndex].data.splice(pIdx, 1);
        saveAndRefresh();
    }
}

// --- 5. MODAL LOGIC ---

function openInputModal(title, defaultValue = "", callback) {
    const modal = document.getElementById('input-modal');
    const field = document.getElementById('custom-input-field');
    const titleEl = document.getElementById('input-modal-title');
    
    if(!modal || !field) return;

    titleEl.innerText = title;
    field.value = defaultValue;
    modal.style.display = 'flex';
    field.focus();

    currentInputCallback = callback;

    field.onkeydown = (e) => {
        if (e.key === 'Enter') handleInputSubmit();
    };
}

function handleInputSubmit() {
    const val = document.getElementById('custom-input-field').value.trim();
    if (val && currentInputCallback) {
        currentInputCallback(val);
    }
    closeInputModal();
}

function closeInputModal() {
    document.getElementById('input-modal').style.display = 'none';
    currentInputCallback = null;
}

function createNewCourse() {
    document.getElementById('modal-overlay').style.display = 'flex';
}

function closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
}

function handleCreateCourse() {
    const nameInput = document.getElementById('new-course-name');
    const contentInput = document.getElementById('new-course-content');
    
    if (!nameInput.value || !contentInput.value) return alert("Fields cannot be empty");

    const lines = contentInput.value.split('\n');
    let formattedData = [];
    let currentPhase = null;

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        if (trimmed.startsWith('#')) {
            if (currentPhase) formattedData.push(currentPhase);
            currentPhase = { title: trimmed.replace('#', '').trim(), tasks: [], completed: {} };
        } else if (currentPhase) {
            currentPhase.tasks.push(trimmed);
        }
    });

    if (currentPhase) formattedData.push(currentPhase);
    courses.push({ name: nameInput.value, data: formattedData });
    
    nameInput.value = '';
    contentInput.value = '';
    activeCourseIndex = courses.length - 1;
    saveAndRefresh();
    renderSidebar();
    closeModal();
}

// --- 6. UTILITIES ---

function updateProgress() {
    const course = courses[activeCourseIndex];
    if (!course) return;
    let total = 0, done = 0;
    course.data.forEach(p => {
        total += p.tasks.length;
        done += Object.values(p.completed || {}).filter(v => v).length;
    });
    const percent = Math.round((done / total) * 100) || 0;
    document.getElementById('global-progress').style.width = percent + '%';
    document.getElementById('progress-text').innerText = `${percent}% Complete`;
}

function saveAndRefresh() {
    localStorage.setItem('courses', JSON.stringify(courses));
    renderCourse();
}

function resetMainUI() {
    document.getElementById('active-course-title').innerText = "No Course Selected";
    document.getElementById('roadmap-container').innerHTML = "";
    document.getElementById('global-progress').style.width = '0%';
    document.getElementById('progress-text').innerText = "0% Complete";
}

// Helper & Prompt UI
function openHelper() { document.getElementById('helper-modal').style.display = 'flex'; }
function closeHelper() { document.getElementById('helper-modal').style.display = 'none'; }
function copyPrompt() {
    const promptText = document.getElementById('ai-prompt').innerText;
    navigator.clipboard.writeText(promptText).then(() => {
        const btn = document.querySelector('.btn-copy');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        setTimeout(() => btn.innerHTML = '<i class="fas fa-copy"></i> Copy Prompt', 2000);
    });
}

// START APP
init();