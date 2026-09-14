import { Game } from './Game.jsx';
import { Capabilities } from './Capabilities.jsx';
import { Stories } from './Stories.jsx';
import { Characters } from './Characters.jsx';
export function App() {
  if(new URLSearchParams(location.search).get('view') === 'characters') return <Characters/>;
  if(new URLSearchParams(location.search).get('view') === 'stories') return <Stories/>;
  return new URLSearchParams(location.search).get('view') === 'duel'
    ? <><Game/><a className="return-capabilities" href="?view=capabilities">返回能力展示</a></>
    : <Capabilities/>;
}
