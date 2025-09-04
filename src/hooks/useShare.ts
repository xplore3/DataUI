//import { watchApi } from '@/services/watch';
import { useUserStore } from '@/stores/useUserStore';
import { toast } from 'react-toastify';

const useShare = () => {
  const handleShareClick = (text: string) => {
    const userId = useUserStore.getState().getUserId();

    if (userId) {
      toast('Shared');
      console.log(text);
      //watchApi.reTweeted(text, userId ? userId : '');
    } else {
      //toast('Please authorize your X account on the Agent page first.');
      toast('Please wait for the funtion to be developed...');
    }
  };

  return {
    handleShareClick,
  };
};

export default useShare;
