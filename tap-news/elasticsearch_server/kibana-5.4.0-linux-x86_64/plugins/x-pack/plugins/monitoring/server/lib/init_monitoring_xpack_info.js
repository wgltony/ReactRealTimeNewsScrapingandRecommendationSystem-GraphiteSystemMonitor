import { once, partialRight } from 'lodash';
import _xpackInfo from '../../../../server/lib/_xpack_info';

export default once(partialRight(_xpackInfo, 'monitoring'));
