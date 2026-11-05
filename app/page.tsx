import { getChatGPTUser } from './chatgpt-auth';
import Platform from './components/platform';
export const dynamic = 'force-dynamic';
export default async function Home() {
 const user = await getChatGPTUser();
 return <Platform user={user ? {name:user.displayName,email:user.email} : null} />;
}
