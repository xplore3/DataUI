//import { watchApi } from '@/services/watch';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'react-toastify';

const useShare = () => {
  const handleShareClick = (text: string) => {
    const userId = useUserStore.getState().getUserId();

    const accessToken = useUserStore.getState().userProfile?.accessToken;
    if (userId && accessToken) {
      toast('Shared on X');
      console.log(text);
      //watchApi.reTweeted(text, userId ? userId : '');
    } else {
      toast('Please authorize your X account on the Agent page first.');
    }
  };

  return {
    handleShareClick,
  };
};

export default useShare;
