import { genFormPage } from './form.js';
import { genDetailPage } from './detail.js';
import { genListPage } from './list.js';
import { cap } from '../utils.js';

export function genCrud({ resource, baseEndpoint, fields = [], color }) {
  const R = cap(resource);
  const r = resource.toLowerCase();
  return {
    list: {
      code: genListPage({ pageName: R, endpoint: baseEndpoint, fields }),
      filename: `${R}List.tsx`,
      route: `/${r}`,
      routeName: `${R}List`,
    },
    detail: {
      code: genDetailPage({ pageName: R, endpoint: baseEndpoint + '/:id', fields }),
      filename: `${R}Detail.tsx`,
      route: `/${r}/:id`,
      routeName: `${R}Detail`,
    },
    form: {
      code: genFormPage({ pageName: 'Create' + R, endpoint: baseEndpoint, method: 'POST', fields, color }),
      filename: `${R}Form.tsx`,
      route: `/${r}/new`,
      routeName: `${R}Form`,
    },
    editForm: {
      code: genFormPage({ pageName: 'Edit' + R, endpoint: baseEndpoint + '/:id', method: 'PUT', fields, color }),
      filename: `${R}EditForm.tsx`,
      route: `/${r}/:id/edit`,
      routeName: `${R}EditForm`,
    },
  };
}
