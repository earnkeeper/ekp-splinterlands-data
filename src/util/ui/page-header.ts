import { Col, Icon, Row, Span } from '@earnkeeper/ekp-sdk';

export function pageHeader(icon: string, title: string) {
  return Row({
    className: 'mb-2',
    children: [
      Col({
        className: 'col-auto my-auto',
        children: [
          Icon({
            name: icon,
          }),
        ],
      }),
      Col({
        className: 'col-auto my-auto pl-0',
        children: [
          Span({
            className: 'font-medium-5',
            content: title,
          }),
        ],
      }),
    ],
  });
}
