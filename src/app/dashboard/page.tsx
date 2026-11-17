import { styled, Theme, CSSObject, List, ListItemButton, ListItemText, FormControl, MenuItem, InputLabel, Select, SelectChangeEvent, TextField, SxProps, Box, InputAdornment, Typography, Link } from "@mui/material";
import MuiDrawer from "@mui/material/Drawer";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WorkersCompPSNavigation } from "../../constansts/WorkersCompPSNavigation";
import { athBlue, athGray, athGreen } from "../../theme/colors";
import { ProgramSummaryTabs } from "../../types/AthensTypes";
import { SummaryNavigation } from "../../types/SummaryNavigation";
import { PSOption } from "../../types/ProgramSummary/PSOption";
import { ProgramSummaryChildProps } from "../../types/ProgramSummary/PSChildProps";
import { useGetPSSidebarMenu } from "../../hooks/LineofBuisiness/useGetPSSidebarMenu";
import { useAuth } from "../../hooks/contextHooks/useAuth";
import { TreeItem, TreeView } from "@mui/x-tree-view";
import Loading from "../Loading";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { API_URL } from "../../constansts/API_URL";
import { useAxios } from "../../hooks/useAxios";
const drawerWidth = 400;

type OrgTreeNode = {
  id: string;
  label: string;
  children: OrgTreeNode[];
};

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

  // Constrain only the Program dropdown.
  ".program-dropdown": {
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",

    ".MuiFormControl-root": {
      width: "100%",
      minWidth: 0,
    },

    ".MuiInputBase-root": {
      width: "100%",
      minWidth: 0,
      boxSizing: "border-box",
    },

    ".MuiSelect-select": {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
  },
};

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
  const { request: orgTreeGetRequest } = useAxios();
  const [orgLoading, setOrgLoading] = useState(
    !!psSharedState?.programid
  );
  const [orgTree, setOrgTree] = useState<OrgTreeNode[]>([]);
  const [orgSearch, setOrgSearch] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);
  const [showOrgTree, setShowOrgTree] = useState(false);
  const [selectedOrganization, setSelectedOrganization] =
    useState<OrgTreeNode | null>(null);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("");
  const isProgramSelected = !!psSharedState?.programid;

  const navigate = useNavigate();
  useEffect(() => {
    const currentTab = WorkersCompPSNavigation.find((x) => x.summaryUrl.toLocaleLowerCase() == location.pathname.replace(/\/+$/g, "").toLocaleLowerCase())?.summaryTab;
    setSelectedTab(currentTab);
  }, []);

  const sideBarMenu = useGetPSSidebarMenu(auth?.response?.lob);

  const buildTree = (data: any): OrgTreeNode[] => {
    const nodeMap: Record<string, OrgTreeNode> = {};

    data.orgs.forEach((org: any) => {
      nodeMap[org.organizationid] = {
        id: String(org.organizationid),
        label: org.organizationdesc,
        children: [],
      };
    });

    const roots: OrgTreeNode[] = [];

    data.orgs.forEach((org: any) => {
      const node = nodeMap[org.organizationid];

      if (org.ParentID !== "0" && nodeMap[org.ParentID]) {
        nodeMap[org.ParentID].children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const getAllNodeIds = (nodes: OrgTreeNode[]): string[] =>
    nodes.flatMap((n) => [n.id, ...getAllNodeIds(n.children)]);

  useEffect(() => {
    const programId = psSharedState?.programid;

    if (!programId) {
      setOrgTree([]);
      return;
    }

    const loadOrgTree = async () => {
      try {
        setOrgLoading(true);

        console.log("Fetching organization tree for program ID:", programId);
        const response = await orgTreeGetRequest(
          `${API_URL.ORG_TREE}?programid=${programId}`,
          "GET"
        );

        console.log("API response:", response);

        const tree = buildTree(response);

        console.log("Tree:", tree);

        setOrgTree(tree);
        setExpandedNodes([]);
        setShowOrgTree(false);
        setSelectedOrganization(null);
        setSelectedOrganizationId("");
        setOrgSearch("");
      } catch (error) {
        console.error("Error fetching organization tree:", error);
        setOrgTree([]);
      } finally {
        setOrgLoading(false);
      }
    };

    loadOrgTree();
  }, [psSharedState?.programid]);

  console.log("Organization tree:", orgTree);
  async function handleChange({ target: { value } }: SelectChangeEvent) {
    console.log("Selected Program ID:", value);
    const programName = options?.programs.filter((x) => x.programid == value)[0]?.programname;
    setPSSharedState({ type: "PROGRAM_CHANGE", payload: { programid: value, programname: programName ?? "" } });

    if (!value) {
      setOrgTree([]);
      setSelectedOrganization(null);
      setSelectedOrganizationId("");
      setOrgSearch("");
      setExpandedNodes([]);
      setShowOrgTree(false);
      return;
    }
  }

  function onTabClick(tab: SummaryNavigation<ProgramSummaryTabs>) {
    navigate(tab.summaryUrl);
    setSelectedTab(tab.summaryTab);
  }

const handleOrganizationSelect = (node: OrgTreeNode) => {
  setSelectedOrganization(node);
  setSelectedOrganizationId(node.id);
  setOrgSearch(node.label);
  setShowOrgTree(false);

  setPSSharedState({
    type: "ORG_CHANGE",
    payload: {
      orgId: Number(node.id),
      orgName: node.label,
    },
  });
};

  const filterTree = (nodes: OrgTreeNode[], search: string): OrgTreeNode[] => {
    if (!search.trim()) return nodes;

    return nodes
      .map((node) => {
        const children = filterTree(node.children, search);

        if (
          node.label.toLowerCase().includes(search.toLowerCase()) ||
          children.length > 0
        ) {
          return { ...node, children };
        }
        return null;
      })
      .filter(Boolean) as OrgTreeNode[];
  };



  const renderTree = (nodes: OrgTreeNode[]): React.ReactNode =>
    nodes.map((node) => (
      <TreeItem
        key={node.id}
        nodeId={node.id}
        label={node.label}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleOrganizationSelect(node);
        }}
      >
        {renderTree(node.children)}
      </TreeItem>
    ));

  console.log("Program options:", options?.programs);
  console.log("Selected program ID:", psSharedState?.programid);

  useEffect(() => {
  if (!showOrgTree) return;

  if (
    orgSearch.trim() &&
    (!selectedOrganization ||
      orgSearch !== selectedOrganization.label)
  ) {
    setExpandedNodes(getAllNodeIds(orgTree));
  }
}, [orgSearch, selectedOrganization, showOrgTree]);

const findNode = (
  nodes: OrgTreeNode[],
  id: string
): OrgTreeNode | null => {
  for (const node of nodes) {
    if (node.id === id) return node;

    const child = findNode(node.children, id);
    if (child) return child;
  }

  return null;
};

// Display the selected organization name.
useEffect(() => {
  if (psSharedState?.orgName) {
    setOrgSearch(psSharedState.orgName);
  } else {
    setOrgSearch("");
  }
}, [psSharedState?.orgName]);

// Restore the selected organization after the tree loads.
useEffect(() => {
  if (!psSharedState?.orgId || orgTree.length === 0) {
    setSelectedOrganization(null);
    setSelectedOrganizationId("");
    return;
  }

  const node = findNode(orgTree, String(psSharedState.orgId));

  if (node) {
    setSelectedOrganization(node);
    setSelectedOrganizationId(node.id);
    setOrgSearch(node.label);
  }
}, [psSharedState?.orgId, orgTree]);


  return (
    <Drawer variant="permanent" open={false} sx={drawerSX} >
      <Box className="program-dropdown">
        <FormControl fullWidth sx={{ ...formControlSX, minWidth: 0 }}>
          <Select
            value={psSharedState?.programid || ""}
            onChange={handleChange}
            key={psSharedState?.programid ?? "programId"}
          >
            {options?.programs?.map((program) => (
              <MenuItem key={program.programid} value={program.programid}>
                {program.programname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>



      <>
        <Box sx={{ width: "100%" }}>
          <Typography sx={{ fontSize: "14px", fontWeight: 700, mb: -2.5, mt: 4 }}>
            Location
          </Typography>

          <TextField
            disabled={!isProgramSelected}
            fullWidth
            value={orgSearch}
            placeholder={!isProgramSelected ? "Please select a Program" : ""}
            onChange={(e) => {
              if (!isProgramSelected) return;

              setOrgSearch(e.target.value);
              setShowOrgTree(true);
            }}
            onFocus={() => {
              if (!isProgramSelected || orgTree.length === 0) return;

              setShowOrgTree(true);
              if (selectedOrganizationId) {
                setExpandedNodes(getAllNodeIds(orgTree));
              } else {
                setExpandedNodes([]);
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end"
                  sx={{
                    width: 32,
                    justifyContent: "right",
                  }}>
                  {isProgramSelected && (orgSearch || selectedOrganizationId) && (
                    <CloseRoundedIcon
                      sx={{ cursor: "pointer", fontSize: 16 }}
                      onClick={() => {
                        setOrgSearch("");
                        setSelectedOrganization(null);
                        setSelectedOrganizationId("");
                        setShowOrgTree(false);
                        setExpandedNodes([]);

                        setPSSharedState({
                          type: "ORG_CHANGE", payload: {
                            orgId: undefined,
                            orgName: undefined,
                          }
                        })
                      }}

                    />
                  )}

                  <Box
                    sx={{ cursor: "pointer", display: "flex" }}
                    onClick={
                      () => {
                        if (!isProgramSelected) return;
                        if (!showOrgTree) {
                          setExpandedNodes(getAllNodeIds(orgTree));
                        }

                        setShowOrgTree((prev) => !prev)
                      }}
                  >
                    {showOrgTree ? (
                      <ArrowDropUpIcon />
                    ) : (
                      <ArrowDropDownIcon />
                    )}
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{
              width: "100%",
              "& .MuiOutlinedInput-root": {
                marginLeft: "-8px",
              },
              "& .MuiInputAdornment-positionStart": {
                marginLeft: "0px",
              },
              "& .MuiInputBase-input": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
          <Link
            component="button"
            underline="none"
            sx={{
              mt: 1,
              fontWeight: 600,
              color: athBlue.primary,
              display: orgSearch || selectedOrganizationId ? "inline-flex" : "none",
            }}
            onClick={() => {
              setOrgSearch("");
              setSelectedOrganization(null);
              setSelectedOrganizationId("");
              setShowOrgTree(false);
              setExpandedNodes([]);

              setPSSharedState({
                type: "ORG_CHANGE", payload: {
                  orgId: undefined,
                  orgName: undefined,
                }
              })


            }}
          >
            Clear
          </Link>
          {orgLoading ? (
            <Loading />
          ) : (
            showOrgTree &&
            orgTree.length > 0 && (
              <Box
                sx={{
                  mt: 1,
                  border: "1px solid #ccc",
                  borderRadius: 1,
                  background: "#fff",
                  maxHeight: 350,
                  overflow: "auto",
                }}
              >
                <TreeView
                  expanded={expandedNodes}
                  selected={selectedOrganizationId || ""}
                  onNodeToggle={(_, ids) =>
                    setExpandedNodes(ids as string[])
                  }
                >
                  {renderTree(filterTree(orgTree, orgSearch))}
                </TreeView>
              </Box>
            )
          )}
        </Box>
      </>

      <List sx={listSX} aria-label="contacts" >
        {sideBarMenu?.map((tab, index) => (
          <ListItemButton key={index} selected={selectedTab === tab.summaryTab}>
            <ListItemText primary={tab.summaryTab} onClick={() => onTabClick(tab)} /> </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
}
