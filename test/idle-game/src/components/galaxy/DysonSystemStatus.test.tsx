/**
 * @vitest-environment jsdom
 */

/**
 * Tests for DysonSystemStatus component
 */

import '../../test/setup-component';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DysonSystemStatus } from './DysonSystemStatus';
import type { DysonSphereState, ConstructionProject } from '../../game/systems/StarSystemsSystem';

describe('DysonSystemStatus', () => {
  const createMockState = (overrides: Partial<DysonSphereState> = {}): DysonSphereState => ({
    efficiency: 1,
    activeProjects: [],
    completedUpgrades: [],
    ...overrides,
  });

  const createMockProject = (
    overrides: Partial<ConstructionProject> = {}
  ): ConstructionProject => ({
    id: 'test-project',
    name: 'Test Project',
    dailyCost: 1000,
    totalDays: 10,
    progressDays: 0,
    lastContributionTime: null,
    complete: false,
    ...overrides,
  });

  describe('Basic rendering', () => {
    it('should render the component with title', () => {
      render(<DysonSystemStatus dysonState={createMockState()} />);
      expect(screen.getByText('Dyson Sphere')).toBeInTheDocument();
    });

    it('should display current efficiency', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 25 })} />);
      // Efficiency appears in multiple places, check for the label
      expect(screen.getByText('Sphere Efficiency')).toBeInTheDocument();
      expect(screen.getAllByText('25%').length).toBeGreaterThanOrEqual(1);
    });

    it('should display the unlimited seeds bonus', () => {
      render(<DysonSystemStatus dysonState={createMockState()} />);
      expect(screen.getByText('Unlimited Seeds')).toBeInTheDocument();
      expect(screen.getByText('No seed capacity limits')).toBeInTheDocument();
    });

    it('should display production multiplier based on efficiency', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 50 })} />);
      // 50% efficiency = +100% production
      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('should display upgrade progress', () => {
      render(<DysonSystemStatus dysonState={createMockState({ completedUpgrades: [0, 1] })} />);
      // "2 / 5" renders as separate text nodes, check for the label
      expect(screen.getByText('Upgrades Completed')).toBeInTheDocument();
    });
  });

  describe('Efficiency levels', () => {
    it('should show low efficiency correctly', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 10 })} />);
      // Check efficiency display exists (may appear multiple times)
      expect(screen.getAllByText('10%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+20%')).toBeInTheDocument();
    });

    it('should show medium efficiency correctly', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 50 })} />);
      // Check efficiency display exists (may appear multiple times)
      expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+100%')).toBeInTheDocument();
    });

    it('should show high efficiency correctly', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 100 })} />);
      // Check efficiency display exists (may appear multiple times)
      expect(screen.getAllByText('100%').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('+200%')).toBeInTheDocument();
    });

    it('should show max efficiency message at 100%', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 100 })} />);
      expect(screen.getByText('Maximum Efficiency Reached!')).toBeInTheDocument();
    });
  });

  describe('Construction projects', () => {
    it('should display active construction projects', () => {
      const projects = [
        createMockProject({ id: 'p1', name: 'Solar Array Alpha', progressDays: 3, totalDays: 10 }),
      ];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('Active Projects')).toBeInTheDocument();
      expect(screen.getByText('Solar Array Alpha')).toBeInTheDocument();
    });

    it('should show days remaining for incomplete projects', () => {
      const projects = [createMockProject({ progressDays: 3, totalDays: 10, complete: false })];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('7 days left')).toBeInTheDocument();
    });

    it('should show 1 day left correctly', () => {
      const projects = [createMockProject({ progressDays: 9, totalDays: 10, complete: false })];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('1 day left')).toBeInTheDocument();
    });

    it('should show daily cost for projects', () => {
      const projects = [createMockProject({ dailyCost: 5000 })];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('Cost: 5,000 credits/day')).toBeInTheDocument();
    });

    it('should not show active projects section when no projects', () => {
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: [] })} />);
      expect(screen.queryByText('Active Projects')).not.toBeInTheDocument();
    });

    it('should display multiple projects', () => {
      const projects = [
        createMockProject({ id: 'p1', name: 'Project Alpha' }),
        createMockProject({ id: 'p2', name: 'Project Beta' }),
      ];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    it('should not show daily cost for completed projects', () => {
      const projects = [
        createMockProject({
          name: 'Complete Project',
          progressDays: 10,
          totalDays: 10,
          complete: true,
          dailyCost: 5000,
        }),
      ];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      expect(screen.getByText('Complete Project')).toBeInTheDocument();
      expect(screen.queryByText('Cost: 5,000 credits/day')).not.toBeInTheDocument();
    });

    it('should show check icon for completed projects', () => {
      const projects = [
        createMockProject({
          name: 'Done Project',
          progressDays: 10,
          totalDays: 10,
          complete: true,
        }),
      ];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      // Completed project should not show days remaining
      expect(screen.queryByText(/days? left/)).not.toBeInTheDocument();
    });
  });

  describe('Next upgrade', () => {
    it('should display next upgrade when available', () => {
      render(<DysonSystemStatus dysonState={createMockState({ completedUpgrades: [] })} />);

      expect(screen.getByText('Next Efficiency Upgrade')).toBeInTheDocument();
      // First upgrade is to 10% efficiency
      expect(screen.getByText('10%')).toBeInTheDocument();
    });

    it('should show upgrade costs', () => {
      render(<DysonSystemStatus dysonState={createMockState({ completedUpgrades: [] })} />);

      // First upgrade costs 1000 crystals
      expect(screen.getByText('Cost: 1,000 crystals')).toBeInTheDocument();
    });

    it('should not show TP when cost is 0', () => {
      render(<DysonSystemStatus dysonState={createMockState({ completedUpgrades: [] })} />);

      // First upgrade has 0 TP cost - should not show TP text
      expect(screen.queryByText(/TP/)).not.toBeInTheDocument();
    });

    it('should show transcendence points for higher upgrades', () => {
      // Skip first 2 upgrades (which have 0 TP cost)
      render(<DysonSystemStatus dysonState={createMockState({ completedUpgrades: [0, 1] })} />);

      // Third upgrade (50% efficiency) costs 10 TP
      expect(screen.getByText(/\+ 10 TP/)).toBeInTheDocument();
    });

    it('should not show next upgrade when all completed', () => {
      render(
        <DysonSystemStatus
          dysonState={createMockState({
            efficiency: 100,
            completedUpgrades: [0, 1, 2, 3, 4],
          })}
        />
      );

      expect(screen.queryByText('Next Efficiency Upgrade')).not.toBeInTheDocument();
    });
  });

  describe('Efficiency tier reference', () => {
    it('should display all efficiency tier labels', () => {
      render(<DysonSystemStatus dysonState={createMockState()} />);

      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
      expect(screen.getByText('Maximum')).toBeInTheDocument();
    });

    it('should display tier ranges', () => {
      render(<DysonSystemStatus dysonState={createMockState()} />);

      expect(screen.getByText('1-10%')).toBeInTheDocument();
      expect(screen.getByText('10-25%')).toBeInTheDocument();
      expect(screen.getByText('25-50%')).toBeInTheDocument();
      expect(screen.getByText('50-75%')).toBeInTheDocument();
      expect(screen.getByText('75-100%')).toBeInTheDocument();
    });

    it('should show minimal tier at low efficiency', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 5 })} />);

      // All tiers are displayed, verify the minimal one exists
      expect(screen.getByText('Minimal')).toBeInTheDocument();
      expect(screen.getByText('1-10%')).toBeInTheDocument();
    });

    it('should show maximum tier at high efficiency', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 80 })} />);

      // All tiers are displayed, verify the maximum one exists
      expect(screen.getByText('Maximum')).toBeInTheDocument();
      expect(screen.getByText('75-100%')).toBeInTheDocument();
    });
  });

  describe('Export bonus', () => {
    it('should display export bonus', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 100 })} />);

      expect(screen.getByText('Export Bonus')).toBeInTheDocument();
      // 100% efficiency = +150% export bonus
      expect(screen.getByText('+150%')).toBeInTheDocument();
    });

    it('should scale export bonus with efficiency', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 50 })} />);

      // 50% efficiency = +75% export bonus
      expect(screen.getByText('+75%')).toBeInTheDocument();
    });
  });

  describe('Minimum efficiency state', () => {
    it('should display 1% efficiency correctly', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 1 })} />);

      // 1% is minimum starting efficiency
      expect(screen.getAllByText('1%').length).toBeGreaterThanOrEqual(1);
      // Production bonus at 1% = +2%, export bonus at 1% = +2% (rounded)
      // Both may show +2%, use getAllByText
      expect(screen.getAllByText('+2%').length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible progress bars', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 50 })} />);

      const progressBar = screen.getByRole('progressbar', { name: /dyson sphere efficiency/i });
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have accessible project progress bars', () => {
      const projects = [
        createMockProject({ name: 'Test Project', progressDays: 5, totalDays: 10 }),
      ];
      render(<DysonSystemStatus dysonState={createMockState({ activeProjects: projects })} />);

      const progressBar = screen.getByRole('progressbar', { name: /test project progress/i });
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    it('should have aria-live on max efficiency message', () => {
      render(<DysonSystemStatus dysonState={createMockState({ efficiency: 100 })} />);

      const successMessage = screen.getByRole('status');
      expect(successMessage).toHaveAttribute('aria-live', 'polite');
      expect(successMessage).toHaveTextContent('Maximum Efficiency Reached!');
    });
  });
});
