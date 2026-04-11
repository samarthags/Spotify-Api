import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { slot, access_token, refresh_token, expires_in } = router.query;
    if (access_token && slot) {
      sessionStorage.setItem(`${slot}_access_token`, access_token);
      if (refresh_token) sessionStorage.setItem(`${slot}_refresh_token`, refresh_token);
      sessionStorage.setItem(`${slot}_expires_at`, Date.now() + parseInt(expires_in) * 1000);
    }
    router.replace('/');
  }, [router.isReady]);

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#080810', color:'#fff', fontFamily:'sans-serif' }}>
      <p>Connecting... 🎵</p>
    </div>
  );
}