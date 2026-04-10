
import React from 'react'
import { IoIosSearch } from "react-icons/io";
const AdminTopSearchBar = () => {
  return (
    <div className='searchbox position-relative d-flex align-items-center'>
        <IoIosSearch className='mr-2'/>
        <input type="text" placeholder='search' />
    </div>
  )
}

export default AdminTopSearchBar
