import { styled, Theme, CSSObject, List, ListItemButton, ListItemText, FormControl, MenuItem, InputLabel, Select, SelectChangeEvent, TextField, SxProps, } from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WorkersCompPSNavigation } from "../../constansts/WorkersCompPSNavigation";
import { athBlue, athGray, athGreen } from "../../theme/colors";
import { ProgramSummaryTabs } from "../../types/AthensTypes";
import { SummaryNavigation } from "../../types/SummaryNavigation";
import { PSOption } from "../../types/ProgramSummary/PSOption";
import { ProgramSummaryChildProps } from "../../types/ProgramSummary/PSChildProps";
import { OrganizationLevel2 } from "../../types/ProgramSummary/OrganizationLevel2";
import { OrganizationLevel3 } from "../../types/ProgramSummary/OrganizationLevel3";
import { VirtualizedAutocomplete } from "../Shared/VirtualizedAutocomplete";
import { useGetPSSidebarMenu } from "../../hooks/LineofBuisiness/useGetPSSidebarMenu";
import { useAuth } from "../../hooks/contextHooks/useAuth";
const drawerWidth = 400;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  position: "relative",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme: Theme): CSSObject => ({
  position: "relative",

  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",

  ...(open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
  ...(!open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
}));

const drawerSX: SxProps<Theme> = {
  display: "block",
  backgroundColor: athGray[100],
  boxShadow: "none",
  padding: "24px 34px 24px 27px",

  div: {
    minHeight: "auto",
    borderRight: "none",
    background: "transparent",
    width: "100%!important",
    button: {
      m: "0",
      color: athBlue.primary,
    },
  },
  span: {
    minHeight: "32px",
    height: "auto",
  },
  ".MuiInputBase-formControl": {
    borderRight: "1px",
    div: {
      borderRight: "1px",
    },
  },
}

const formControlSX: SxProps<Theme> = {
  display: "flex",
  height: "85px",
  ".MuiInputBase-formControl": {
    border: "none",
    borderBottom: "1px solid",
    borderColor: athGray[200],
    margin: "0 0 10px 0",
    height: "auto",
    boxShadow: "none",
    fontSize: "32px",
    lineHeight: "36px",
    fontWeight: "800",
    ".MuiSelect-select": {
      minHeight: "auto",
      padding: "18px 0 20px 0",
    },
    "&:hover": {
      border: "none",
      boxShadow: "none",
      borderBottom: "1px solid",
      borderColor: athGray[200],
      margin: "0",
    },
    "&.Mui-focused": {
      border: "none",
      boxShadow: "none",
      borderBottom: "1px solid",
      borderColor: athGray[200],
      margin: "0",
    },
  },
  select: {
    padding: "0px",
  },
  label: {
    fontSize: "24px",
    lineHeight: "28px",
    fontWeight: "600",
    top: "42px",
    "&.Mui-focused,&.MuiFormLabel-filled": {
      display: "none",
    },
  },
}

const virtualizedAutocompleteSX: SxProps<Theme> = {
  ".MuiFormControl-fullWidth": {
    margin: "0",
  },
  ".MuiInputBase-fullWidth": {
    py: "0",
  },
  ".MuiAutocomplete-endAdornment": {
    width: "1px !important",
    display: "flex",
    justifyContent: "end",
  },
}

const listSX: SxProps<Theme> = {
  width: "100%",
  mt: "28px",
  display: "block",
  ".MuiListItemButton-gutters": {
    p: "0",
    mb: "23px",
    borderRadius: "16px",
    "&:hover": {
      background: athGreen.primary,
      span: {
        color: "white",
      },
    },
    div: {
      p: "0",
      m: "0",

      span: {
        height: "42px",
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        fontSize: "14px",
        fontWeight: "700",
        color: athGray[700],
      },
    },
    "&.Mui-selected": {
      background: athGreen.primary,
      span: {
        color: "white",
      },
      "&:hover": {
        background: athGreen.primary,
      },
    },
  },
}

const formControl2SX: SxProps<Theme> = {
  mt: "25px",
  mb: "15px",
  ".MuiInputBase-formControl": {
    borderRight: "1px solid",
    borderColor: athGray[200],
    boxShadow: "none",
  },
}

interface ProgramSummarySidebarProps extends ProgramSummaryChildProps {
  options: PSOption | null;
}
export function ProgramSummarySidebar({
  options,
  setPSSharedState,
  psSharedState,
}: ProgramSummarySidebarProps) {
  const location = useLocation();
  const { auth } = useAuth();
  const [selectedTab, setSelectedTab] = useState<
    ProgramSummaryTabs | undefined
  >();
  const navigate = useNavigate();
  useEffect(() => {
    const currentTab = WorkersCompPSNavigation.find((x) => x.summaryUrl.toLocaleLowerCase() == location.pathname.replace(/\/+$/g, "").toLocaleLowerCase())?.summaryTab;
    setSelectedTab(currentTab);
  }, []);
  const sideBarMenu = useGetPSSidebarMenu(auth?.response?.lob);
  function handleChange({ target: { value } }: SelectChangeEvent) {
    const programName = options?.programs.filter((x) => x.programid == value)[0]?.programname;
    setPSSharedState({ type: "PROGRAM_CHANGE", payload: { programid: value, programname: programName ?? "" } });
  }
  function handleOrg2Change(event: any, value: OrganizationLevel2 | null) {
    setPSSharedState({ type: "ORG_LEVEL2_CHANGE", payload: value?.level2_id ?? "" });
  }
  function handleOrg3Change(event: any, value: OrganizationLevel3 | null) {
    setPSSharedState({ type: "ORG_LEVEL3_CHANGE", payload: value?.level3_id ?? "" });
  }
  function onTabClick(tab: SummaryNavigation<ProgramSummaryTabs>) {
    navigate(tab.summaryUrl);
    setSelectedTab(tab.summaryTab);
  }
  return (
    <Drawer variant="permanent" open={false} sx={drawerSX} >
      <FormControl fullWidth sx={formControlSX} >
        <Select value={psSharedState?.programid} onChange={handleChange} key={psSharedState?.programid ?? 'programId'} >
          {options?.programs?.map((program) => (
            <MenuItem key={program.programid} value={program.programid}>
              {program.programname}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ ...formControl2SX, mt: "35px" }} >
        <InputLabel id="label" sx={{ fontSize: "14px", fontWeight: "700" }}> Organization Level 2 </InputLabel>
        <VirtualizedAutocomplete
          options={options?.orglvl2s ?? []}
          getOptionLabel={(org2) => org2.level2_desc}
          onChange={handleOrg2Change}
          value={options?.orglvl2s.find((x) => x.level2_id == psSharedState.orglvl2) || null}
          renderInput={(params) => <TextField {...params} placeholder="All" />}
          sx={virtualizedAutocompleteSX}
        />
      </FormControl>
      <FormControl fullWidth sx={formControl2SX} >
        <InputLabel id="label" sx={{ fontSize: "14px", fontWeight: "700" }}> Organization Level 3 </InputLabel>
        <VirtualizedAutocomplete
          options={options?.orglvl3s ?? []}
          getOptionLabel={(org3) => org3.level3_desc}
          onChange={handleOrg3Change}
          value={options?.orglvl3s.find((x) => x.level3_id == psSharedState.orglvl3) || null}
          renderInput={(params) => <TextField {...params} placeholder="All" />}
          sx={virtualizedAutocompleteSX}
        />
      </FormControl>

      <List sx={listSX} aria-label="contacts" >
        {sideBarMenu?.map((tab, index) => (
          <ListItemButton key={index} selected={selectedTab === tab.summaryTab}>
            <ListItemText primary={tab.summaryTab} onClick={() => onTabClick(tab)} /> </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
