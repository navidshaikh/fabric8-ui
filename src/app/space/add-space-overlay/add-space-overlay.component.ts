import {
  Component,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';

import { Broadcaster, Notification, Notifications, NotificationType } from 'ngx-base';
import { Context, SpaceNamePipe, SpaceService } from 'ngx-fabric8-wit';
import { ProcessTemplate } from 'ngx-fabric8-wit';
import { Space, SpaceAttributes } from 'ngx-fabric8-wit';
import { UserService } from 'ngx-login-client';
import { Observable } from 'rxjs';

import { ContextService } from 'app/shared/context.service';
import { DummyService } from 'app/shared/dummy.service';
import { SpaceNamespaceService } from 'app/shared/runtime-console/space-namespace.service';
import { SpacesService } from 'app/shared/spaces.service';

@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'f8-add-space-overlay',
  styleUrls: ['./add-space-overlay.component.less'],
  templateUrl: './add-space-overlay.component.html'
})
export class AddSpaceOverlayComponent implements OnInit {
  currentSpace: Space;
  selectedTemplate: ProcessTemplate;
  spaceTemplates: ProcessTemplate[];
  space: Space;

  constructor(private router: Router,
              public dummy: DummyService,
              private spaceService: SpaceService,
              private notifications: Notifications,
              private userService: UserService,
              private spaceNamespaceService: SpaceNamespaceService,
              private spaceNamePipe: SpaceNamePipe,
              private spacesService: SpacesService,
              private context: ContextService,
              private broadcaster: Broadcaster) {
    this.spaceTemplates = dummy.processTemplates;
    this.space = this.createTransientSpace();
  }

  ngOnInit() {
    const srumTemplates = this.spaceTemplates.filter(template => template.name === 'Scenario Driven Planning');
    if (srumTemplates && srumTemplates.length > 0) {
      this.selectedTemplate = srumTemplates[0];
    }
    this.context.current.subscribe((ctx: Context) => {
      if (ctx.space) {
        this.currentSpace = ctx.space;
      }
    });
  }

  /*
   * Creates a persistent collaboration space
   * by invoking the spaceService
   */
  createSpace() {
    if (!this.space) {
      this.space = this.createTransientSpace();
    }
    this.space.attributes.name = this.space.name.replace(/ /g, '_');
    this.userService.getUser()
      .switchMap(user => {
        this.space.relationships['owned-by'].data.id = user.id;
        return this.spaceService.create(this.space);
      })
      .do(createdSpace => {
        this.spacesService.addRecent.next(createdSpace);
      })
      .switchMap(createdSpace => {
        return this.spaceNamespaceService
          .updateConfigMap(Observable.of(createdSpace))
          .map(() => createdSpace)
          // Ignore any errors coming out here, we've logged and notified them earlier
          .catch(err => Observable.of(createdSpace));
      })
      .subscribe(createdSpace => {
          this.router.navigate([createdSpace.relationalData.creator.attributes.username,
            createdSpace.attributes.name]);
          this.showAddAppOverlay();
          this.hideAddSpaceOverlay();
        },
        err => {
          this.notifications.message(<Notification> {
            message: `Failed to create "${this.space.name}"`,
            type: NotificationType.DANGER
          });
        });
  }

  hideAddSpaceOverlay(): void {
    this.broadcaster.broadcast('showAddSpaceOverlay', false);
  }

  showAddAppOverlay(): void {
    this.broadcaster.broadcast('showAddAppOverlay', true);
  }

  private createTransientSpace(): Space {
    let space = {} as Space;
    space.name = '';
    space.path = '';
    space.attributes = new SpaceAttributes();
    space.attributes.name = space.name;
    space.type = 'spaces';
    space.privateSpace = false;
    space.process = { name: '', description: '' };
    space.relationships = {
      areas: {
        links: {
          related: ''
        }
      },
      iterations: {
        links: {
          related: ''
        }
      },
      workitemtypegroups: {
        links: {
          related: ''
        }
      },
      'owned-by': {
        data: {
          id: '',
          type: 'identities'
        }
      }
    };
    return space;
  }
}
