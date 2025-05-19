import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// [POST] 이벤트 등록 처리
router.post('/register', async (req: Request, res: Response) => {
  try {
    const response = await axios.post('http://event:3000/register', req.body); // MSA event 서버 호출

    res.status(200).json({ message: response.data.message }); // 성공 응답 클라이언트 전달
  } catch (err) {
    console.error(err);
    const message = err?.response?.data?.message || '이벤트 등록 실패';
    res.status(400).json({ message });
  };
});

// [GET] 이벤트 조회
router.get('/getEvents', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };
    const response = await axios.get('http://event:3000/getEvents', {
      headers: {
        Cookie: `access_token=${token}`,
      }
    }); // 
    res.status(200).json(response.data);
  } catch (err) {
    console.error('이벤트 목록 조회 오류:', err?.response?.data);
    res.status(500).json({ message: '이벤트 조회 실패' });
  };
});

// [GET] 보상 수령 상태 조회
router.get('/reward-status', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    const token = req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };
    const response = await axios.get('http://event:3000/reward-status', {
      params: { eventId },
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json(response.data);
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 상태 조회 실패';
    console.error('보상 상태 조회 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

// [POST] 보상 등록
router.post('/updateReward', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' })
    };

    const response = await axios.post('http://event:3000/updateReward', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 등록 실패';
    console.error('보상 등록 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

// [POST] 보상 요청
router.post('/request-reward', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };

    const response = await axios.post('http://event:3000/request-reward', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 요청 실패';
    console.error('보상 요청 오류:', msg);
    res.status(500).json({ message: msg });
  };
});


// [DELETE] 이벤트 삭제
router.delete('/delete/:id', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };
    const { id } = req.params;

    const response = await axios.delete(`http://event:3000/delete/${id}`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '이벤트 삭제 실패';
    console.error('이벤트 삭제 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

// [POST] 이벤트 참여
router.post('/userParticipate', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };

    const response = await axios.post('http://event:3000/userParticipate', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '이벤트 참여 실패';
    console.error('이벤트 참여 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

// [GET] 유저의 이벤트 조건 진행도 조회
router.get('/progress', async (req: Request, res: Response) => {
  try {
    const { eventId } = req.query;
    const token = req.cookies?.access_token;

    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };

    const response = await axios.get('http://event:3000/progress', {
      params: { eventId },
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json(response.data);
  } catch (err) {
    const msg = err?.response?.data?.message || '이벤트 진행도 조회 실패';
    console.error('이벤트 진행도 조회 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

// [GET] 특정 이벤트의 보상 요청 내역 조회
router.get('/getRequestsByEvent/:eventId', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };

    const { eventId } = req.params;

    const response = await axios.get(`http://event:3000/requests/${eventId}`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });
    res.status(200).json(response.data);
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 요청 내역 조회 실패';
    console.error('보상 요청 내역 조회 오류:', msg);
    res.status(500).json({ message: msg });
  };
});
 
// [PATCH] 보상 요청 승인
router.patch('/approve-reward', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    }
    
    const response = await axios.patch('http://event:3000/approve-reward', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 승인 실패';
    console.error('보상 승인 오류:', msg);
    res.status(500).json({ message: msg });
  };
});


// [PATCH] 보상 요청 거절
router.patch('/reject-reward', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    };

    const response = await axios.patch('http://event:3000/reject-reward', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });

    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 거절 실패';
    console.error('보상 거절 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

//[PATCH] 보상 거절 알림확인 
router.patch('/rejected-reward/check', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      res.status(401).json({ message: '인증 토큰이 없습니다' });
    }

    const response = await axios.patch('http://event:3000/rejected-reward/check', req.body, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });
    res.status(200).json({ message: response.data.message });
  } catch (err) {
    const msg = err?.response?.data?.message || '보상 거절 알림 확인 실패';
    console.error('보상 거절 알림 확인 오류:', msg);
    res.status(500).json({ message: msg });
  };
});

export default router;
