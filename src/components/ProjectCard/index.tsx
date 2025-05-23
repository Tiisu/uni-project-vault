
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Globe, Users, Sparkles, ExternalLink } from 'lucide-react';
import { AccessLevel, ProjectData } from '@/lib/blockchain';

interface ProjectCardProps {
  project: ProjectData;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const { id, title, authors, uploadDate, description, accessLevel, departmentId, year } = project;
  const { address } = useWallet();

  // Check if this is the user's own project
  const isOwnProject = address && authors.some(author => author.toLowerCase() === address.toLowerCase());

  // Format date
  const formattedDate = new Date(uploadDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Truncate description if it's too long
  const truncatedDescription = description.length > 150
    ? `${description.substring(0, 150)}...`
    : description;

  // Render the appropriate access level icon and color
  const renderAccessLevel = () => {
    switch(accessLevel) {
      case AccessLevel.Public:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-700 border-green-300">
            <Globe className="h-3 w-3" />
            Public
          </Badge>
        );
      case AccessLevel.Restricted:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-amber-100 text-amber-700 border-amber-300">
            <Users className="h-3 w-3" />
            Restricted
          </Badge>
        );
      case AccessLevel.Private:
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-100 text-red-700 border-red-300">
            <Lock className="h-3 w-3" />
            Private
          </Badge>
        );
      default:
        return null;
    }
  };

  // Truncate author address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card
      className={`h-full flex flex-col hover:shadow-lg transition-shadow duration-300 overflow-hidden
        ${accessLevel === AccessLevel.Private && isOwnProject ? 'border-red-300 bg-red-50/30' :
          accessLevel === AccessLevel.Restricted && isOwnProject ? 'border-amber-300 bg-amber-50/30' :
          'border-university-blue/20'}`}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl text-university-navy hover:text-university-blue transition-colors">
            <Link to={`/project/${id}`}>{title}</Link>
            {isOwnProject && (accessLevel === AccessLevel.Private || accessLevel === AccessLevel.Restricted) && (
              <span className="ml-2 text-xs bg-university-gold text-white px-2 py-0.5 rounded-full">
                Your Project
              </span>
            )}
          </CardTitle>
          {renderAccessLevel()}
        </div>
        <CardDescription className="flex flex-wrap gap-1 items-center text-sm text-gray-600 mt-2">
          <span className="font-semibold">Authors:</span>
          {authors.slice(0, 2).map((author, index) => (
            <a
              key={index}
              href={`https://etherscan.io/address/${author}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-university-blue transition-colors"
            >
              {shortenAddress(author)}{index < Math.min(authors.length, 2) - 1 ? ', ' : ''}
            </a>
          ))}
          {authors.length > 2 && <span>+ {authors.length - 2} more</span>}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-2 flex-grow">
        <p className="text-gray-700">{truncatedDescription}</p>
      </CardContent>

      <CardFooter className="pt-2 flex flex-col gap-3 border-t">
        <div className="flex flex-wrap justify-between text-sm text-gray-500">
          <div className="flex items-center">
            <Badge variant="outline" className="bg-university-light text-university-navy">
              {year}
            </Badge>
          </div>
          <div>
            Uploaded {formattedDate}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link to={`/project/${id}`}>
            <Button variant="outline" size="sm" className="text-university-blue border-university-blue hover:bg-university-blue/10">
              View Details
            </Button>
          </Link>
          <Link to={`/project/${id}#ai-insights`}>
            <Button variant="outline" size="sm" className="text-university-gold border-university-gold hover:bg-university-gold/10 flex items-center">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Insights
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
