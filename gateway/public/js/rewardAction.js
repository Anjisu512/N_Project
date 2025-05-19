let eventList = [];
let currentPage = 1;
const rowsPerPage = 5;

// 페이지 로딩 시 이벤트 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/event/getEvents');
        eventList = await res.json();
        initPaginationAndRender();
    } catch (err) {
        console.error('이벤트 목록 조회 실패', err);
        document.getElementById('eventTableBody').innerHTML =
            `<tr><td colspan="6">이벤트 불러오기 실패</td></tr>`;
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
        tableBody.innerHTML = `<tr><td colspan="6">등록된 이벤트가 없습니다.</td></tr>`;
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
      <td>${event.status === 'active' ? '활성화' : '비활성화'}</td>
      <td>
        <button class="reward-request-view-btn" data-eventid="${event._id}">
          요청확인
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


//버튼클릭 리스너
document.addEventListener('click', async (e) => {
    //보상 요청 버튼을 클릭한경우
    if (e.target.classList.contains('reward-request-view-btn')) {
        const eventId = e.target.dataset.eventid;
        openRequestCheckModal(eventId);
    }
    //보상 요청 modal 닫기
    if (e.target.id === 'closeRequestModal') {
        document.getElementById('requestCheckModal').classList.add('hidden');
    }

    // 보상 승인
    if (e.target.classList.contains('rewardAct-approve-btn')) {
        const eventId = e.target.dataset.eventid;
        const userId = e.target.dataset.userid;
        await approveReward(eventId,userId);
    }

    // 보상 거부
    if (e.target.classList.contains('rewardAct-reject-btn')) {
        const eventId = e.target.dataset.eventid;
        const userId = e.target.dataset.userid;
        await rejectReward(eventId,userId);
    }
});

//보상 요청 확인 modal onmount
async function openRequestCheckModal(eventId) {
    try {
        const res = await fetch(`/event/getRequestsByEvent/${eventId}`);
        const data = await res.json();
        const box = document.getElementById('requestDetailsBox');
        box.innerHTML = '';

        if (!Array.isArray(data) || data.length === 0) {
            box.innerHTML = '<p>요청 내역이 없습니다.</p>';
        } else {
            data.forEach(req => {
                const item = document.createElement('div');
                item.classList.add('rewardAct-request-item');

                item.innerHTML = `
            <div class="rewardAct-request-info">
              <strong>유저:</strong> ${req.username} &nbsp;
              <strong>요청일:</strong> ${new Date(req.requestedAt).toLocaleString()}<br/>
              <strong>이벤트 달성:</strong> (${req.eventConditionInUser.conditionKey}) ${req.eventConditionInUser.userProgress} / ${req.eventConditionInUser.requiredValue} &nbsp;
              <strong>조건:</strong> ${req.eventConditionInUser.isComplete ? '✅' : '❌'}
            </div>
            <div class="rewardAct-request-actions">
              <button class="rewardAct-action-btn rewardAct-approve-btn" data-eventid="${eventId}" data-userid="${req.userId}">
                보상 승인
              </button>
              <button class="rewardAct-action-btn rewardAct-reject-btn" data-eventid="${eventId}" data-userid="${req.userId}">
                보상 거부
              </button>
            </div>
          `;

                box.appendChild(item);
            });
        }

        document.getElementById('requestCheckModal').classList.remove('hidden');
    } catch (err) {
        console.error('요청 내역 불러오기 실패', err);
        document.getElementById('requestDetailsBox').innerHTML = '<p>불러오기 실패</p>';
        document.getElementById('requestCheckModal').classList.remove('hidden');
    }
}

//보상 승인
async function approveReward(eventId,userId) {
    try {
        const res = await fetch(`/event/approve-reward`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId,userId })
        });
        const result = await res.json();
        alert(result.message || '보상 승인 완료');
        openRequestCheckModal(eventId);
    } catch (err) {
        console.error('보상 승인 실패', err);
        alert('보상 승인 실패');
    }
}

//보상 거절
async function rejectReward(eventId,userId) {
    try {
        const res = await fetch(`/event/reject-reward`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ eventId,userId })
        });
        const result = await res.json();
        alert(result.message || '보상 거절 완료');
        openRequestCheckModal(eventId,userId);
    } catch (err) {
        console.error('보상 거절 실패', err);
        alert('보상 거절 실패');
    }
}
