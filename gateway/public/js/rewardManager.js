let eventList = [];
let currentPage = 1;
const rowsPerPage = 5;
let rewardArray = [];

// onMount
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/event/getEvents');
        eventList = await res.json();
        initPaginationAndRender();
    } catch (err) {
        console.error('이벤트 목록 조회 실패', err);
        document.getElementById('eventTableBody').innerHTML =
            `<tr><td colspan="5">이벤트 불러오기 실패</td></tr>`;
    }
});

function initPaginationAndRender() {
    renderTablePage(currentPage);
    renderPagination();
}

function renderTablePage(page) {
    const tableBody = document.getElementById('eventTableBody');
    tableBody.innerHTML = '';
    const start = (page - 1) * rowsPerPage;
    const paginatedItems = eventList.slice(start, start + rowsPerPage);

    if (paginatedItems.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5">등록된 이벤트가 없습니다.</td></tr>`;
        return;
    }

    paginatedItems.forEach(event => {
        const tr = document.createElement('tr');

        const rewardCell = Array.isArray(event.rewards)
            ? event.rewards.map(r => `${r.type} (${r.amount})`).join(', ')
            : '';

        tr.innerHTML = `
            <td>${event.title}</td>
            <td>${event.description || '-'}</td>
            <td>${event.startDate} ~ ${event.endDate}</td>
            <td>${rewardCell}</td>
            <td>
              <button class="reward-edit-btn" data-event='${JSON.stringify(event)}'>
                등록/수정
              </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    container.innerHTML = '';

    const pageCount = Math.ceil(eventList.length / rowsPerPage);

    // 이전 버튼
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.classList.add('pagination-btn');
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTablePage(currentPage);
            renderPagination();
        }
    });
    container.appendChild(prevBtn);

    // 숫자 버튼
    for (let i = 1; i <= pageCount; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.classList.add('pagination-btn');
        if (i === currentPage) btn.classList.add('active');
        btn.addEventListener('click', () => {
            currentPage = i;
            renderTablePage(currentPage);
            renderPagination();
        });
        container.appendChild(btn);
    }

    // 다음 버튼
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.classList.add('pagination-btn');
    nextBtn.disabled = currentPage === pageCount;
    nextBtn.addEventListener('click', () => {
        if (currentPage < pageCount) {
            currentPage++;
            renderTablePage(currentPage);
            renderPagination();
        }
    });
    container.appendChild(nextBtn);
}

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('reward-edit-btn')) {
        const event = JSON.parse(e.target.dataset.event);
        openRewardEditModal(event);
    }

    if (e.target.id === 'closeRewardModal') {
        document.getElementById('rewardEditModal').classList.add('hidden');
    }
});

document.getElementById('cancelBtn').addEventListener('click', () => {
    document.getElementById('rewardEditModal').classList.add('hidden');
});

// 모달 열기 시 초기화
function openRewardEditModal(event) {
    document.getElementById('rewardEditModal').classList.remove('hidden');
    document.getElementById('modalEventId').value = event._id;
    document.getElementById('rewardTypeInput').value = '';
    document.getElementById('rewardAmountInput').value = '';
    rewardArray = Array.isArray(event.rewards) ? [...event.rewards] : [];
    renderRewardList();

    //이벤트 활성화 상태 체크 status가 null이나 undefiend인 경우도 비활성화에 check되있도록 설정
    if (event.status === 'active') {
        document.getElementById('statusActive').checked = true;
    } else if (event.status === 'inactive') {
        document.getElementById('statusInactive').checked = true;
    } else {
        // status가 undefined 또는 비정상 값일 경우 기본값: 비활성화
        document.getElementById('statusInactive').checked = true;
    }
}

// 보상 항목 렌더링
function renderRewardList() {
    const list = document.getElementById('rewardList');
    list.innerHTML = '';
    rewardArray.forEach((reward, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${reward.type} (${reward.amount}) <button type="button" onclick="removeReward(${index})">삭제</button>`;
        list.appendChild(li);
    });
}

// 보상 항목 추가
document.getElementById('addRewardBtn').addEventListener('click', () => {
    const type = document.getElementById('rewardTypeInput').value.trim();
    const amount = parseInt(document.getElementById('rewardAmountInput').value.trim(), 10);

    if (!type || isNaN(amount) || amount < 1) {
        alert('보상과 수량을 올바르게 입력해주세요.');
        return;
    }

    rewardArray.push({ type, amount });
    renderRewardList();

    // 입력값 초기화
    document.getElementById('rewardTypeInput').value = '';
    document.getElementById('rewardAmountInput').value = '';
});

// 보상 항목 삭제
function removeReward(index) {
    rewardArray.splice(index, 1);
    renderRewardList();
}

// 저장 시 event 서버 전송
document.getElementById('rewardForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const eventId = document.getElementById('modalEventId').value;
    const selectedStatus = document.querySelector('input[name="eventStatus"]:checked')?.value;

    try {
        const res = await fetch('/event/updateReward', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                eventId,
                rewards: rewardArray,
                status: selectedStatus
            })
        });

        const result = await res.json();
        alert(result.message || '보상 저장 완료');
        location.reload();
    } catch (err) {
        console.error('보상 저장 실패', err);
        alert('저장 실패');
    }
});
