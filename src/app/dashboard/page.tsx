import { useReducer, useEffect, useRef } from 'react';
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import { ProgramSummarySidebar } from "./PSSidebar";
import { useAxios } from "../../hooks/useAxios";
import { API_URL } from "../../constansts/API_URL";
import { PSOption } from "../../types/ProgramSummary/PSOption";
import { ProgramSummaryReducer } from '../../Reducer/ProgramSummaryReducer';
import { ProgramSummarySharedValues } from '../../types/ProgramSummary/ProgramSummarySharedValues';
import { useAuth } from '../../hooks/contextHooks/useAuth';
import { ObjectToQueryString } from '../../utils/object.utils';
import { ProgramSummarySidebarSkeleton } from './PSSkeletons/PSSidebarSkeleton';
import { ProgrmSummaryAction } from '../../types/ProgramSummary/PSAction';

export function ProgramSummaryContainer() {

    // At first, the options API will be called without any query string parameters, 
    // but after the successful API call, the reducer will set the data to psSharedState, 
    // which will re render the component. This time, the getOptionsAPIURL function will return a new url(with program id querystring),
    // and useAxios will trigger another call, but it will return the same(previous) data. So this ref is used to avoid the second API call.
    const preventOptionCall = useRef(false)

    const [psSharedState, dispatch] = useReducer(ProgramSummaryReducer, {} as ProgramSummarySharedValues);
    const { auth, dispatchAuth } = useAuth();

    const { data, isLoading } = useAxios<PSOption>(getOptionsAPIURL(), 'GET')

    useEffect(() => {
        if (auth.selectedMenu != 'Program Summary') {
            dispatchAuth({ type: 'SET_SELECTED_MENU', payload: 'Program Summary' })
        }
    }, [])
    useEffect(() => {
        if (data && !psSharedState.programid) {
            //preventOptionCall.current = true;
            dispatch({ type: 'PROGRAM_CHANGE', payload: { programid: data?.programs[0].programid ?? '', programname: data?.programs[0].programname ?? '' } })
            preventOptionCall.current = true;
        }
    }, [data])

    function setPSSharedState(action: ProgrmSummaryAction) {
        preventOptionCall.current = false;
        dispatch(action)
    }

    function getOptionsAPIURL() {
        let url = '';
        if (!preventOptionCall.current) {
            const parameters = ObjectToQueryString(
                (({ programid, orglvl2 }) => ({ programid, orglvl2 }))(psSharedState))
            url = `${API_URL.PS_OPTIONS}?${parameters}`
        }

        return url;
    }
    return <Box sx={{ display: "flex" }}>
        {isLoading ? <ProgramSummarySidebarSkeleton /> : <ProgramSummarySidebar options={data} setPSSharedState={setPSSharedState} psSharedState={psSharedState} />}
        {psSharedState.programid && <Outlet context={{ psSharedState, setPSSharedState }} />}
    </Box>
}
