// -- copyright
// OpenProject is an open source project management software.
// Copyright (C) 2012-2022 the OpenProject GmbH
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See COPYRIGHT and LICENSE files for more details.
//++

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { applyTransaction, QueryEntity } from '@datorama/akita';
import { Observable } from 'rxjs';
import {
  catchError, map, switchMap, tap,
} from 'rxjs/operators';
import { IFileLink } from 'core-app/core/state/file-links/file-link.model';
import { IHALCollection } from 'core-app/core/apiv3/types/hal-collection.type';
import { ToastService } from 'core-app/shared/components/toaster/toast.service';
import { FileLinksStore } from 'core-app/core/state/file-links/file-links.store';
import { insertCollectionIntoState } from 'core-app/core/state/collection-store';

@Injectable()
export class FileLinkResourceService {
  protected store = new FileLinksStore();

  constructor(
    private readonly http:HttpClient,
    private readonly toastService:ToastService,
  ) {}

  fetchCurrent(fileLinksSelfLink:string):void {
    this.http
      .get<IHALCollection<IFileLink>>(fileLinksSelfLink)
      .pipe(
        tap((collection) => insertCollectionIntoState(this.store, collection, fileLinksSelfLink)),
        catchError((error) => {
          this.toastService.addError(error);
          throw error;
        }),
      ).subscribe();
  }

  all(key:string):Observable<IFileLink[]> {
    const query = new QueryEntity(this.store);
    return query
      .select()
      .pipe(
        map((state) => state.collections[key]?.ids),
        switchMap((fileLinkIds) => query.selectMany(fileLinkIds)),
      );
  }

  remove(collectionKey:string, fileLink:IFileLink):void {
    if (!fileLink._links.delete) {
      return;
    }

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    this.http
      .delete<void>(fileLink._links.delete.href, { withCredentials: true, headers })
      .pipe(
        catchError((error) => {
          this.toastService.addError(error);
          throw error;
        }),
      )
      .subscribe(() => {
        applyTransaction(() => {
          this.store.remove(fileLink.id);
          this.store.update(({ collections }) => (
            {
              collections: {
                ...collections,
                [collectionKey]: {
                  ...collections[collectionKey],
                  ids: (collections[collectionKey]?.ids || []).filter((id) => id !== fileLink.id),
                },
              },
            }
          ));
        });
      });
  }
}
