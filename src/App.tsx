// src/App.tsx
import { useEffect, useState } from "react";
import LoginPage from "./LoginPage";
import AdminView from "./AdminView";
import UserView from "./UserView";
import Header from "./Header";
import { requestWakeLock } from "./wakeLock";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const[buttonName,setButtonName]=useState<string>('attendance');
 const [punchType, setPunchType] = useState<'IN' | 'OUT' | null>(null);

  useEffect(() => {
    requestWakeLock();
  }, []);
  
  useEffect(() => {
  const savedRole = localStorage.getItem("userRole");
  if (savedRole && savedRole !== "X") {
    setIsLoggedIn(true);
    setRole(savedRole);
  }
}, []);


  const handleLoginSuccess = (userRole: string) => {
    localStorage.setItem("userRole", userRole);
    setIsLoggedIn(true);
    setRole(userRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    setIsLoggedIn(false);
    setRole(null);
  };

  if (!isLoggedIn) return <LoginPage onLoginSuccess={handleLoginSuccess} />;

  return (
    <div style={{width:'100%',height:'100vh'}}>
      <Header role={role} onLogout={handleLogout} setButtonName={setButtonName}  buttonName={buttonName} setPunchType={setPunchType}/>
      {role === "Y" && <AdminView  buttonName={buttonName} punchType={punchType} setPunchType={setPunchType}/>}
      {role === "N" && <UserView punchType={punchType} setPunchType={setPunchType}/>}
      {!["Y", "N"].includes(role ?? "") && <div>Unknown role</div>}
    </div>
  );
}

export default App;
