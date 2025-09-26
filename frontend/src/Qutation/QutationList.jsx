import React, { useState } from 'react'
import "./qutation-styles.scss"
import { CiSearch } from "react-icons/ci";
import { IoMdPrint } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import { MdModelTraining } from "react-icons/md";
import { CgMenuGridO } from "react-icons/cg";
import { IoSettingsSharp } from "react-icons/io5";
import { MdSummarize } from "react-icons/md";

const QutationList = () => {

    const [ quotelist,setQuotelist ] = useState();



  return (

     <section className="right-content">
            <div>
                <div className="quote-list-header">
                    <h4> Quotations </h4>

                    <div className='header-controls-list'>

                        <span > Count 520 </span>
                        <span> Pre Tax 520 </span>
                        <span> Total 520 </span>

                        <div className='search-container'>
                            <em className='search-icon'><CiSearch /></em>
                            <input className='search-input' />
                        </div>
                        <button>
                            <IoMdPrint /> &nbsp;
                            Print Settings

                        </button>
                        <button title='export to excel'>
                                <IoDocumentText />
                        </button>
                        <button title='Display Preference'>
                               <CgMenuGridO />
                        </button>
                        <button title='Item Summery'>
                                <MdSummarize />
                        </button>
                        <button title='Sales Configuration'>
                                <IoSettingsSharp />
                        </button>
                        


                    </div>

                </div>

                <div className='filters-list'>
                    <div className='filter'>

                        <div className='patch-btn' onClick={(e)=>{  e.currentTarget.classList.toggle("bg-orange"); }}>
                            All
                        </div>

                        <div className="patch-btn" 
                        onClick={(e)=>{  e.currentTarget.classList.toggle("bg-orange"); }}
                        > Qutation </div>
                        <div className="patch-btn"
                        onClick={(e)=>{  e.currentTarget.classList.toggle("bg-orange"); }}
                        > Proforma Invoices </div>
                        <div>
                            <select >
                                <option value={'This Month'}> This Month</option>
                                <option value={'Not Expired'}>Not Expired </option>
                                <option value={'Expired'}>Expired</option>
                                <option value={'Last Month'}>Last Month</option>
                                <option value={'Fin Year'}>Fin Year</option>
                                <option value={'Other'}>Other</option>
                                <option value={'Pending Approval'}>Pending Approval</option>
                            </select>
                        </div>

                        <div>
                            <select >
                                <option value={'All'}> All</option>
                                <option value={'Rejected'}>Rejected </option>
                                <option value={'Open'}>Open</option>
                                <option value={'Expired'}>Expired</option>
                                <option value={'Cancelled'}>Cancelled</option>
                                <option value={'Converted'}>Converted</option>
                                <option value={'Replaced'}>Replaced</option>
                            </select>
                        </div>

                        <div>
                            <select >
                                <option value={'All'}> All Branches</option>
                                <option value={'Branch 1'}>Branch 1 </option>
                                <option value={'Branch 2'}>Branch 2</option> 
                            </select>
                               
                        </div>

                        <div>
                            <select >
                                <option value={'All'}> All Excecutives</option>
                                <option value={'Branch 1'}>Suresh H B </option>
                                <option value={'Branch 2'}>Harish M D</option> 
                            </select>
                               
                        </div>

                    </div>

                    <button className='add-qutation-btn'>
                            + Add Qutation
                    </button>

                </div>

                <div className="table-container">
                    <h1> NO DATA YET </h1>
                </div>
                <div className="footer-buttons">
                    <button>  
                        <span>
                            <MdModelTraining />
                        </span>
                        Training Matrial
                    </button>
                    <button>
                        <span>
                            <FaYoutube />
                        </span>
                        
                         Watch Training 
                    </button>
                </div>


            
            </div>

    </section>
  )
}

export default QutationList
