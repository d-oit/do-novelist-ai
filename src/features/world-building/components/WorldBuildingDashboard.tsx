/**
 * World-Building Dashboard
 * Main interface for managing world-building elements
 */

import {
  Map,
  Users,
  MapPin,
  Clock,
  BookOpen,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Filter,
} from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@shared/components/button';
import { Card } from '@shared/components/card';

import { cn } from '../../../lib/utils';
import { useWorldBuilding } from '../hooks/useWorldBuilding';


interface WorldBuildingDashboardProps {
  projectId: string;
}

const WorldBuildingDashboard: React.FC<WorldBuildingDashboardProps> = ({ projectId }) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'locations' | 'cultures' | 'timeline' | 'lore'
  >('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const {
    locations,
    cultures,
    timelines,
    lore,
    isLoading,
    validation,
    createLocation,
    createCulture,
    validateWorldBuilding,
  } = useWorldBuilding(projectId);

  const handleCreateLocation = (): void => {
    void createLocation({
      name: 'New Location',
      type: 'city',
      description: 'A new location to be explored...',
    });
  };

  const handleCreateCulture = (): void => {
    void createCulture({
      name: 'New Culture',
      type: 'civilization',
      description: 'A fascinating culture with unique traditions...',
      values: ['honor', 'tradition'],
    });
  };

  const stats = [
    {
      label: 'Locations',
      value: locations.length,
      icon: MapPin,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Cultures',
      value: cultures.length,
      icon: Users,
      color: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      label: 'Timelines',
      value: timelines.length,
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Lore Entries',
      value: lore.length,
      icon: BookOpen,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ];

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary' />
          <p className='text-muted-foreground'>Loading world-building data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-bold'>World-Building Assistant</h2>
          <p className='mt-2 text-muted-foreground'>
            Create and manage the rich world behind your story
          </p>
        </div>

        <div className='flex items-center gap-3'>
          {validation && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2',
                validation.isValid
                  ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300',
              )}
            >
              {validation.isValid ? (
                <CheckCircle className='h-4 w-4' />
              ) : (
                <AlertCircle className='h-4 w-4' />
              )}
              <span className='text-sm font-medium'>Score: {validation.score}/100</span>
            </div>
          )}

          <Button onClick={() => void validateWorldBuilding()} variant='outline' size='sm'>
            <CheckCircle className='mr-2 h-4 w-4' />
            Validate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {stats.map(stat => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className='p-4'>
              <div className='flex items-center gap-3'>
                <div className={cn('rounded-md p-2', stat.bgColor)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>{stat.label}</p>
                  <p className='text-2xl font-bold'>{stat.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative max-w-md flex-1'>
          <Search
            className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground'
            aria-hidden='true'
          />
          <input
            id='world-search-input'
            type='text'
            placeholder='Search locations, cultures, events...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-foreground focus:border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-label='Search world elements'
          />
        </div>

        <Button
          variant='outline'
          onClick={() => setShowFilters(!showFilters)}
          className='flex items-center gap-2'
        >
          <Filter className='h-4 w-4' />
          Filters
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className='border-b border-border'>
        <nav className='flex space-x-8'>
          {[
            { id: 'overview', label: 'Overview', icon: Map },
            { id: 'locations', label: 'Locations', icon: MapPin },
            { id: 'cultures', label: 'Cultures', icon: Users },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'lore', label: 'Lore', icon: BookOpen },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className='h-4 w-4' />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='mt-6'>
        {activeTab === 'overview' && (
          <div className='space-y-6'>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <Card className='p-6'>
                <h3 className='mb-4 text-lg font-semibold'>Quick Actions</h3>
                <div className='space-y-3'>
                  <Button
                    onClick={handleCreateLocation}
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Add New Location
                  </Button>
                  <Button
                    onClick={handleCreateCulture}
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Plus className='mr-2 h-4 w-4' />
                    Add New Culture
                  </Button>
                </div>
              </Card>

              <Card className='p-6'>
                <h3 className='mb-4 text-lg font-semibold'>World Health</h3>
                {validation ? (
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span>Consistency Score</span>
                      <span className='font-medium'>{validation.score}/100</span>
                    </div>
                    <div className='h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700'>
                      <div
                        className='h-2 rounded-full bg-primary transition-all duration-300'
                        style={{ width: `${validation.score}%` }}
                      />
                    </div>
                    {validation.issues.length > 0 && (
                      <p className='text-sm text-muted-foreground'>
                        {validation.issues.length} issue{validation.issues.length !== 1 ? 's' : ''}{' '}
                        found
                      </p>
                    )}
                  </div>
                ) : (
                  <p className='text-muted-foreground'>Run validation to check world consistency</p>
                )}
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className='p-6'>
              <h3 className='mb-4 text-lg font-semibold'>Recent Activity</h3>
              <div className='space-y-3'>
                {locations.slice(0, 3).map(location => (
                  <div
                    key={location.id}
                    className='flex items-center gap-3 rounded-md bg-muted p-3'
                  >
                    <MapPin className='h-4 w-4 text-blue-500' />
                    <div>
                      <p className='font-medium'>{location.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {location.type} • Created{' '}
                        {new Date(location.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {cultures.slice(0, 2).map(culture => (
                  <div key={culture.id} className='flex items-center gap-3 rounded-md bg-muted p-3'>
                    <Users className='h-4 w-4 text-green-500' />
                    <div>
                      <p className='font-medium'>{culture.name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {culture.type} • Created {new Date(culture.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {locations.length === 0 && cultures.length === 0 && (
                  <p className='py-8 text-center text-muted-foreground'>
                    No world-building elements yet. Start by creating your first location or
                    culture!
                  </p>
                )}
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Locations ({locations.length})</h3>
              <Button onClick={handleCreateLocation}>
                <Plus className='mr-2 h-4 w-4' />
                Add Location
              </Button>
            </div>

            {locations.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {locations.map(location => (
                  <Card key={location.id} className='p-4'>
                    <div className='mb-3 flex items-start justify-between'>
                      <h4 className='font-semibold'>{location.name}</h4>
                      <span className='rounded bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                        {location.type}
                      </span>
                    </div>
                    <p className='mb-3 line-clamp-3 text-sm text-muted-foreground'>
                      {location.description}
                    </p>
                    <div className='flex items-center justify-between text-xs text-muted-foreground'>
                      <span>Population: {location.population?.toLocaleString() ?? 'Unknown'}</span>
                      <span>{location.tags?.length ?? 0} tags</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='py-12 text-center'>
                <MapPin className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>No Locations Yet</h3>
                <p className='mb-4 text-muted-foreground'>
                  Start building your world by creating your first location
                </p>
                <Button onClick={handleCreateLocation}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create First Location
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cultures' && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold'>Cultures ({cultures.length})</h3>
              <Button onClick={handleCreateCulture}>
                <Plus className='mr-2 h-4 w-4' />
                Add Culture
              </Button>
            </div>

            {cultures.length > 0 ? (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                {cultures.map(culture => (
                  <Card key={culture.id} className='p-4'>
                    <div className='mb-3 flex items-start justify-between'>
                      <h4 className='font-semibold'>{culture.name}</h4>
                      <span className='rounded bg-green-100 px-2 py-1 text-xs text-green-800'>
                        {culture.type}
                      </span>
                    </div>
                    <p className='mb-3 line-clamp-3 text-sm text-muted-foreground'>
                      {culture.description}
                    </p>
                    <div className='mb-3 flex flex-wrap gap-1'>
                      {culture.values.slice(0, 3).map(value => (
                        <span key={value} className='rounded bg-muted px-2 py-1 text-xs'>
                          {value}
                        </span>
                      ))}
                      {culture.values.length > 3 && (
                        <span className='text-xs text-muted-foreground'>
                          +{culture.values.length - 3} more
                        </span>
                      )}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {culture.tags?.length ?? 0} tags
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='py-12 text-center'>
                <Users className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                <h3 className='mb-2 text-lg font-semibold'>No Cultures Yet</h3>
                <p className='mb-4 text-muted-foreground'>
                  Add cultural depth to your world by creating your first culture
                </p>
                <Button onClick={handleCreateCulture}>
                  <Plus className='mr-2 h-4 w-4' />
                  Create First Culture
                </Button>
              </div>
            )}
          </div>
        )}

        {(activeTab === 'timeline' || activeTab === 'lore') && (
          <div className='py-12 text-center'>
            <div className='text-muted-foreground'>
              <Clock className='mx-auto mb-4 h-12 w-12' />
              <h3 className='mb-2 text-lg font-semibold'>Coming Soon</h3>
              <p>
                {activeTab === 'timeline' ? 'Timeline editor' : 'Lore library'} is being developed
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorldBuildingDashboard;
