import React, { useEffect, useMemo, useState } from 'react'
import "./qutation-styles.scss"
import { CiSearch } from "react-icons/ci";
import { IoMdPrint } from "react-icons/io";
import { IoDocumentText } from "react-icons/io5";
import { FaYoutube } from "react-icons/fa";
import { MdModelTraining } from "react-icons/md";
import { CgMenuGridO } from "react-icons/cg";
import { IoSettingsSharp } from "react-icons/io5";
import { MdSummarize } from "react-icons/md";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from "../Config";

const QutationList = () => {
    const navigate = useNavigate();
    const [quotations, setQuotations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    const fetchQuotations = async (params = {}) => {
        try {
            setLoading(true);
            setError("");
            const res = await axios.get(`${BASE_URL}/api/quotations`, {
                params: {
                    page: 1,
                    limit: 50,
                    ...params,
                },
            });
            setQuotations(res.data?.data || []);
        } catch (e) {
            console.error("Failed to fetch quotations", e);
            setError("Failed to fetch quotations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuotations();
    }, []);

    const stats = useMemo(() => {
        const count = quotations.length;
        const preTax = quotations.reduce((sum, q) => sum + (q.total_amount || 0), 0);
        const total = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);
        return { count, preTax, total };
    }, [quotations]);



  return (

     <section className="right-content">
            <div>
                <div className="quote-list-header">
                    <h4> Quotations </h4>

                                        <div className='header-controls-list'>

                                                <span> Count {stats.count} </span>
                                                <span> Pre Tax {stats.preTax.toFixed(2)} </span>
                                                <span> Total {stats.total.toFixed(2)} </span>

                                                <div className='search-container'>
                                                        <em className='search-icon'><CiSearch /></em>
                                                        <input
                                                            className='search-input'
                                                            placeholder='Search by number or customer...'
                                                            value={search}
                                                            onChange={(e)=> setSearch(e.target.value)}
                                                            onKeyDown={(e)=>{
                                                                if (e.key === 'Enter') {
                                                                    // try both filters: quotation_number and customer
                                                                    fetchQuotations({ quotation_number: search, customer: search });
                                                                }
                                                            }}
                                                        />
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

            <button className='add-qutation-btn' onClick={()=> navigate('/quotation')}>
                            + Add Qutation
                    </button>

                </div>

                                <div className="table-container">
                                    {error && (
                                        <div style={{ color: 'red', padding: 8 }}>{error}</div>
                                    )}
                                    {loading ? (
                                        <div style={{ padding: 8 }}>Loading…</div>
                                    ) : quotations.length === 0 ? (
                                        <h1> NO DATA YET </h1>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-bordered">
                                                <thead>
                                                    <tr>
                                                        <th>#</th>
                                                        <th>Quotation No</th>
                                                        <th>Date</th>
                                                        <th>Customer</th>
                                                        <th>Sales Credit</th>
                                                        <th>Items</th>
                                                        <th>Grand Total</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {quotations.map((q, idx) => (
                                                        <tr key={q.quotation_id || idx}>
                                                            <td>{idx + 1}</td>
                                                            <td>{q.quotation_number}</td>
                                                            <td>{q.quotation_date ? new Date(q.quotation_date).toLocaleDateString() : ''}</td>
                                                            <td>{q.customer ? `${q.customer.firstname || ''} ${q.customer.lastname || ''}`.trim() : ''}</td>
                                                            <td>{q.marketing_person ? `${q.marketing_person.firstname || ''} ${q.marketing_person.lastname || ''}`.trim() : ''}</td>
                                                            <td>{Array.isArray(q.quotation_items) ? q.quotation_items.length : 0}</td>
                                                            <td>{q.grand_total?.toFixed ? q.grand_total.toFixed(2) : q.grand_total}</td>
                                                            <td>{q.status}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
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
