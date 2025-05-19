import { formatKoreanDateTime } from './utils/dateFormatter.js';

let rewardHistoryList = [];
let currentPage = 1;
const rowsPerPage = 5;
let filteredList = []; // 필터seach된 데이터 

// 페이지 로딩 시 보상 이력 목록 가져오기
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/auth/reward-requests/history');
    rewardHistoryList = await res.json();
    initPaginationAndRender();
  } catch (err) {
    console.error('보상 이력 조회 실패', err);
    document.getElementById('eventTableBody').innerHTML =
      `<tr><td colspan="5">보상 이력을 불러오는 데 실패했습니다.</td></tr>`;
  };
});

//렌더링 parent
function initPaginationAndRender() {
  //admin혹은 운영자가 이력페이지에서 유저name으로 filter search를 하는경우가 존재하기에 추가됨
  const data = filteredList.length ? filteredList : rewardHistoryList;

  renderTablePage(currentPage, data);
  renderPagination(data);
}

// 테이블 렌더링
function renderTablePage(page, data) {
  const tableBody = document.getElementById('eventTableBody');
  tableBody.innerHTML = '';

  const start = (page - 1) * rowsPerPage;
  const paginatedItems = data.slice(start, start + rowsPerPage);

  if (paginatedItems.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5">보상 요청 이력이 없습니다.</td></tr>`;
    return;
  }

  paginatedItems.forEach(item => {
    //보상
    const rewardText = Array.isArray(item.rewards) ? item.rewards.map(r => `${r.type} (${r.amount})`).join(', ') : '-';

    //보상요청일
    const requestedAt = formatKoreanDateTime(item.requestedAt);

    //보상지급(승인일)
    const approvedAt = formatKoreanDateTime(item.approvedAt);

    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${item.username || '-'}</td>
      <td>${item.eventTitle || '-'}</td>
      <td>${rewardText}</td>
      <td>${requestedAt}</td>
      <td>${approvedAt}</td>
    `;
    tableBody.appendChild(tr);
  });
};

// 페이지네이션 렌더링 filter로 검색하는경우가 추가되어 파라미터에 data를 받아와서 페이징처리
function renderPagination(data) {
  const container = document.getElementById('paginationContainer');
  container.innerHTML = '';

  const pageCount = Math.ceil(data.length / rowsPerPage);

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '◀';
  prevBtn.classList.add('pagination-btn');
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      initPaginationAndRender();
    }
  });
  container.appendChild(prevBtn);

  for (let i = 1; i <= pageCount; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.classList.add('pagination-btn');
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      currentPage = i;
      initPaginationAndRender();
    });
    container.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '▶';
  nextBtn.classList.add('pagination-btn');
  nextBtn.disabled = currentPage === pageCount;
  nextBtn.addEventListener('click', () => {
    if (currentPage < pageCount) {
      currentPage++;
      initPaginationAndRender();
    }
  });
  container.appendChild(nextBtn);
}

// [검색] 유저명을 입력하는경우 전체검색된 data에서 해당되는 유저의name을 검색하는 중에 바로 테이블에서 username을 검색해서 찾아옴
const searchInput = document.getElementById('usernameSearch');
searchInput.addEventListener('input', () => {
  const keyword = searchInput.value.trim().toLowerCase();

  filteredList = rewardHistoryList.filter(item =>
    item.username && item.username.toLowerCase().includes(keyword)
  );

  currentPage = 1; // 검색 시 첫 페이지로 초기화
  initPaginationAndRender();
});