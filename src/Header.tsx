import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import "./Header.css";
import { FiHome, FiLogOut, FiMenu } from "react-icons/fi";

interface HeaderProps {
  role: string | null;
  onLogout: () => void;
  setButtonName: Dispatch<SetStateAction<string>>;
  buttonName:string;
  setPunchType:Dispatch<SetStateAction<'IN' | 'OUT' | null>>;
}

const Header: React.FC<HeaderProps> = ({ role, onLogout, setButtonName , buttonName,setPunchType }) => {
  const [toggle,setToggle]=useState(false);


  const menuRef = useRef<HTMLDivElement | null>(null); // ✅ Typed correctly

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toggle && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setToggle(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [toggle]);



  return (
    <header className="app-header">
      <h1 className="app-title">Face Recognition System</h1>
      {role === "Y" ? (<>
        {buttonName === "onboarding" ?( <p className="app-content-title">On Boarding</p>)
        :buttonName === "attendance" ?(<p className="app-content-title"> Attendance</p>)
        :buttonName === "appsettings" ?(<p className="app-content-title"> App Settings</p>):''}
        </>):''}
        <div style={{display:'flex',gap:'5px'}}>
         <button className="back-button" onClick={()=>{setPunchType(null);setToggle(false)}}>
          <FiHome size={20} />
        </button>
         <button className="back-button" onClick={()=>{setToggle(!toggle)}}>
          <FiMenu size={20} />
        </button>
       </div>
      {toggle ?   
      <div className="header-right" ref={menuRef}>
        {role === "Y" ? (
          <>
          <span className="role-badge" onClick={() => {setButtonName('appsettings');setToggle(false)}}>
              App Settings
            </span>
            <span className="role-badge " onClick={() => {setButtonName('onboarding');setToggle(false)}}>
              On Boarding
            </span>
            <span className="role-badge " onClick={() =>{setButtonName('attendance');setToggle(false)}}>
              Attendance
            </span>
          </>
        ):role === "N" ? (<p className="role-badge ">Attendance</p>):''}
        <button className="logout-button" onClick={()=>{onLogout();setButtonName('attendance');setPunchType(null)}}>
          <FiLogOut size={20} />
        </button>
      </div>
      :''}
    </header>
  );
};

export default Header;