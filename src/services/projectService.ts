import { ProjectData, AccessLevel, mockProjects } from '@/lib/blockchain';
import { generateProjectSummary } from './geminiService';
import { useWallet } from '@/context/WalletContext';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStudentByWallet } from './studentService';

// Create a store to manage projects
interface ProjectStore {
  projects: ProjectData[];
  addProject: (project: ProjectData) => void;
  getProjects: () => ProjectData[];
}

// Create a persistent store that saves projects to localStorage
export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [...mockProjects], // Initialize with mock projects
      addProject: (project: ProjectData) => {
        set((state) => ({
          projects: [project, ...state.projects] // Add new project at the beginning
        }));
      },
      getProjects: () => get().projects
    }),
    {
      name: 'project-storage', // Name for localStorage
    }
  )
);

// Generate a random IPFS hash for mock purposes
export const generateMockIpfsHash = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const prefix = 'Qm';
  let result = prefix;

  // Generate a random 44-character string (typical IPFS hash length)
  for (let i = 0; i < 44; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

// Create a new project from form data
export const createProject = (
  title: string,
  description: string,
  departmentId: number,
  year: number,
  accessLevel: AccessLevel,
  ipfsHash: string = '',
  authorAddress: string = ''
): ProjectData => {
  // Generate a unique ID (higher than existing IDs to avoid conflicts)
  const maxId = Math.max(...useProjectStore.getState().projects.map(p => p.id), 0);
  const newId = maxId + 1;

  // Use provided IPFS hash or generate a mock one
  const hash = ipfsHash || generateMockIpfsHash();

  // Use provided author address or generate a mock one
  const author = authorAddress || `0x${Math.random().toString(16).substring(2, 42)}`;

  // Get student information if available
  const student = getStudentByWallet(author);

  // If student exists, use their department and institution
  const studentDepartmentId = student ? student.departmentId : departmentId;
  const institutionId = student ? student.institutionId : 1; // Default to first institution if not found

  // Create the project object
  const project: ProjectData = {
    id: newId,
    title,
    description,
    departmentId: studentDepartmentId,
    institutionId,
    year,
    accessLevel,
    ipfsHash: hash,
    authors: [author],
    uploadDate: Date.now(),
    creatorAddress: author
  };

  return project;
};

// Add a new project to the store
export const addProject = async (project: ProjectData): Promise<void> => {
  try {
    // Generate AI summary for the project if it doesn't already have one
    if (!project.aiSummary) {
      const summary = await generateProjectSummary(project);
      if (summary) {
        project.aiSummary = summary;
      }
    }
  } catch (error) {
    console.error('Error generating AI summary:', error);
    // Continue without summary if there's an error
  }

  // Add the project to the store
  useProjectStore.getState().addProject(project);
};

// Get all projects from the store with access control
export const getAllProjects = (userAddress?: string | null): ProjectData[] => {
  const projects = useProjectStore.getState().getProjects();
  const student = userAddress ? getStudentByWallet(userAddress) : null;

  // If no user address is provided, only return public projects
  if (!userAddress) {
    return projects.filter(project => project.accessLevel === AccessLevel.Public);
  }

  return projects.filter(project => {
    // Public projects are visible to everyone
    if (project.accessLevel === AccessLevel.Public) {
      return true;
    }

    // Projects authored by the user are always visible
    if (project.authors.includes(userAddress)) {
      return true;
    }

    // Institution-level projects are visible to members of the same institution
    if (project.accessLevel === AccessLevel.Institution && student &&
        project.institutionId === student.institutionId) {
      return true;
    }

    return false;
  });
};

// Get all projects without access control (admin only)
export const getAllProjectsAdmin = (): ProjectData[] => {
  return useProjectStore.getState().getProjects();
};

// Get a project by ID with access control
export const getProjectById = (id: number, userAddress?: string | null): ProjectData | undefined => {
  const projects = useProjectStore.getState().getProjects();
  const project = projects.find(project => project.id === id);
  const student = userAddress ? getStudentByWallet(userAddress) : null;

  if (!project) return undefined;

  // Check access control
  if (
    project.accessLevel === AccessLevel.Public || // Public projects are visible to everyone
    (userAddress && project.authors.includes(userAddress)) || // Author can see their own projects
    (project.accessLevel === AccessLevel.Institution && student &&
     project.institutionId === student.institutionId) // Institution members can see institution projects
  ) {
    return project;
  }

  // Project exists but user doesn't have access
  return undefined;
};

// Update a project in the store
export const updateProject = (updatedProject: ProjectData): void => {
  const { projects, addProject } = useProjectStore.getState();
  const updatedProjects = projects.map(project =>
    project.id === updatedProject.id ? updatedProject : project
  );

  // Clear and re-add all projects (since we don't have a direct update method)
  useProjectStore.setState({ projects: updatedProjects });
};
