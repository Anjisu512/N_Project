import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// [POST] 회원가입 처리
router.post('/register', async (req: Request, res: Response) => {
    try {
        const response = await axios.post('http://auth:3000/register', req.body);
        res.status(200).json({ message: response.data.message }); //JSON으로 응답하여 htmlscript에서 처리
    } catch (err) {
        console.log(err);
        const message = err?.response?.data?.message || '회원가입 실패';
        res.status(400).json({ message });
    };
});

// [POST] 로그인 처리
router.post('/login', async (req, res) => {
    try {
        const response = await axios.post('http://auth:3000/login', req.body);

        const { accessToken, message } = response.data; //auth에서 로그인성공시 jwt token과 보내온 meg 저장

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: false, // HTTPS 환경이면 true 현재는 이벤트관련 간단로직이므로 http로 계속진행
        });

        res.status(200).json({ message }); // 클라이언트에서 alert 처리
    } catch (err) {
        console.log(err?.response?.data);
        const message = err?.response?.data?.message || '로그인 실패';
        res.status(401).json({ message }); //JSON 형식으로 응답
    };
});

// [GET] 유저의 이벤트 보상 지급/수령 내역확인 
router.get('/reward-requests/history', async (req: Request, res: Response) => {
    const token = req.cookies?.access_token;

    if (!token) {
        res.status(401).json({ message: 'JWT 토큰이 없습니다.' });
    };

    try {
        const response = await axios.get('http://auth:3000/reward-requests/history', {
            headers: {
                Cookie: `access_token=${token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (err) {
        console.log(err?.response?.data);
        const message = err?.response?.data?.message || '보상 이력 조회 실패';
        res.status(502).json({ message });
    };
});

// [GET] 마이페이지에서 로그인한 유저 정보 조회
router.get('/getUserInfo/:userId', async (req: Request, res: Response) => {
    const token = req.cookies?.access_token;
    if (!token) {
        res.status(401).json({ message: 'JWT 토큰이 없습니다.' });
    };

    try {
        const { userId } = req.params;
        const response = await axios.get(`http://auth:3000/users/${userId}`, {
            headers: {
                Cookie: `access_token=${token}`,
            },
        });

        res.status(200).json(response.data); // 응답은 그대로 전달
    } catch (err) {
        console.error('유저 정보 조회 오류:', err?.response?.data);
        const message = err?.response?.data?.message || '유저 정보 조회 실패';
        res.status(502).json({ message });
    };
});

// [GET] 유저 권한(Role)을 수정하기 위해 유저정보를 모두 조회
router.get('/users', async (req: Request, res: Response) => {
    const token = req.cookies?.access_token;

    if (!token) {
        res.status(401).json({ message: 'JWT 토큰이 없습니다.' });
    };

    try {
        const response = await axios.get('http://auth:3000/users', {
            headers: {
                Cookie: `access_token=${token}`,
            },
        });

        res.status(200).json(response.data);
    } catch (err) {
        console.error('전체 유저 조회 오류:', err?.response?.data);
        const message = err?.response?.data?.message || '전체 유저 조회 실패';
        res.status(502).json({ message });
    }
});

// [PATCH] 유저 권한 수정
router.patch('/updateUserRole', async (req: Request, res: Response) => {
    try {
        const token = req.cookies?.access_token;
        if (!token) {
            res.status(401).json({ message: 'JWT 토큰이 없습니다.' });
        };

        const response = await axios.patch(`http://auth:3000/updateUserRoles`, req.body, {
            headers: {
                Cookie: `access_token=${token}`,
            },
        });
        res.status(200).json({ message: '유저 권한 수정 성공', data: response.data });
    } catch (err) {
        console.error('유저 권한 수정 오류:', err?.response?.data);
        const message = err?.response?.data?.message || '유저 권한 수정 실패';
        res.status(502).json({ message });
    }
});


export default router;
