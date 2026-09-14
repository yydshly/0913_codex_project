import {useEffect,useRef,useState} from 'react';

export function useStoryAudio(storyId){
  const track=useRef(null),available=useRef(false);
  const [state,setState]=useState('loading'),[muted,setMuted]=useState(false),[volume,setVolume]=useState(.85);
  useEffect(()=>{
    const abort=new AbortController();let sound,disposed=false;
    const load=async()=>{try{
      const response=await fetch(`${import.meta.env.BASE_URL}audio/stories/manifest.json`,{cache:'no-store',signal:abort.signal});
      if(!response.ok)throw new Error('manifest');const manifest=await response.json();const entry=manifest.stories?.[storyId];
      if(!entry){setState('pending');return;}
      if(!new RegExp(`^${storyId}\\.[a-f0-9]{12}\\.wav$`).test(entry.file))throw new Error('file');
      sound=new Audio(`${import.meta.env.BASE_URL}audio/stories/${entry.file}`);sound.preload='auto';sound.preservesPitch=true;sound.hidden=true;sound.dataset.story=storyId;document.body.appendChild(sound);track.current=sound;
      sound.oncanplay=()=>{if(!disposed){available.current=true;setState('ready');}};
      sound.onerror=()=>{if(!disposed){available.current=false;setState('error');}};sound.load();
    }catch(e){if(!disposed&&e.name!=='AbortError')setState('error');}};
    load();return()=>{disposed=true;abort.abort();available.current=false;if(sound){sound.oncanplay=null;sound.onerror=null;sound.pause();sound.removeAttribute('src');sound.load();sound.remove();}track.current=null;};
  },[storyId]);
  useEffect(()=>{if(track.current){track.current.muted=muted;track.current.volume=volume;}},[muted,volume,state]);
  return {state,muted,volume,setMuted,setVolume,available,
    position:()=>track.current?.currentTime,
    start:(time,speed)=>{if(!available.current)return;track.current.currentTime=time;track.current.playbackRate=speed;return track.current.play();},
    pause:()=>track.current?.pause(),
    seek:time=>{if(available.current)track.current.currentTime=time;},
    rate:speed=>{if(track.current)track.current.playbackRate=speed;},
  };
}
