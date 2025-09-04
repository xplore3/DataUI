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
      //toast('Please wait for the funtion to be developed...');
      toast('功能正在开发中，请稍候~~');
    }
  };

  return {
    handleShareClick,
  };
};

export default useShare;
