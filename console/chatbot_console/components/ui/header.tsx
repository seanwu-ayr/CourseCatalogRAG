import React from 'react'
import ProfileIcon from './profile-icon'

const Header = () => {
  return (
    <>
        <div>
            <h2 className="text-xl font-bold">Chatbot Console</h2>
            <p className="text-sm text-blue-100">Santa Clara University</p>
        </div>

        <ProfileIcon></ProfileIcon>        
    </>
  )
}

export default Header