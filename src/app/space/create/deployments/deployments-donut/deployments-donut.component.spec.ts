import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { Component, Input } from '@angular/core';

import { isEqual } from 'lodash';

import { DeploymentsDonutComponent } from './deployments-donut.component';

@Component({
  selector: 'deployments-donut-chart',
  template: ''
})
class FakeDeploymentsDonutChartComponent {
  @Input() desiredReplicas: number;
  @Input() idled: boolean;
  @Input() mini: boolean;
  @Input() pods: any[];
}

describe('DeploymentsDonutComponent', () => {
  let component: DeploymentsDonutComponent;
  let fixture: ComponentFixture<DeploymentsDonutComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DeploymentsDonutComponent, FakeDeploymentsDonutChartComponent]
    });

    fixture = TestBed.createComponent(DeploymentsDonutComponent);
    component = fixture.componentInstance;

    component.mini = false;
    component.applicationId = 'application';

    fixture.detectChanges();
  });

  it('should default with 1 desired replica', () => {
    expect(component.desiredReplicas).toBe(1);
  });

  it('should increment desired replicas on scale up by one', () => {
    let desired = 1;
    expect(component.desiredReplicas).toBe(desired);

    component.scaleUp();
    fixture.detectChanges();
    expect(component.desiredReplicas).toBe(desired + 1);
  });

  it('should decrement desired replicas on scale down by one', () => {
    let desired = 1;
    expect(component.desiredReplicas).toBe(desired);

    component.scaleDown();
    fixture.detectChanges();
    expect(component.desiredReplicas).toBe(desired - 1);
  });

  it('should not decrement desired replicas below zero when scaling down', () => {
    let desired = 1;
    expect(component.desiredReplicas).toBe(desired);

    component.scaleDown();
    fixture.detectChanges();
    expect(component.desiredReplicas).toBe(desired - 1);

    component.scaleDown();
    fixture.detectChanges();
    expect(component.desiredReplicas).toBe(0);
  });

  it('should acquire pods data', () => {
    let expectedPods = [
      {
        status: {
          phase: 'Running'
        }
      }, {
        status: {
          phase: 'Terminating'
        }
      }
    ];
    expect(component.pods).toEqual(expectedPods);
  });
});