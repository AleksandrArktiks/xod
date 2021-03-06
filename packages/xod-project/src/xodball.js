import * as R from 'ramda';
import { Either } from 'ramda-fantasy';
import {
  foldEither,
  explodeEither,
  validateSanctuaryType,
  omitTypeHints,
  fail,
} from 'xod-func-tools';

import { getPatchPath, resolveNodeTypesInPatch } from './patch';
import {
  listLibraryPatches,
  omitPatches,
  injectProjectTypeHints,
  listPatchesWithoutBuiltIns,
} from './project';
import {
  addMissingOptionalProjectFields,
  omitEmptyOptionalProjectFields,
} from './optionalFieldsUtils';
import { Project, def } from './types';

export const fromXodballData = def(
  'fromXodballData :: Object -> Either String Project',
  R.compose(
    R.map(injectProjectTypeHints),
    foldEither(() => fail('INVALID_XODBALL_FORMAT', {}), Either.of),
    validateSanctuaryType(Project),
    addMissingOptionalProjectFields
  )
);

export const fromXodballDataUnsafe = def(
  'fromXodballDataUnsafe :: Object -> Project',
  R.compose(explodeEither, fromXodballData)
);

export const fromXodball = def(
  'fromXodball :: String -> Either String Project',
  jsonString =>
    R.tryCatch(R.pipe(JSON.parse, Either.of), input =>
      fail('NOT_A_JSON', { input })
    )(jsonString).chain(fromXodballData)
);

export const toXodball = def(
  'toXodball :: Project -> String',
  R.compose(
    p => JSON.stringify(p, null, 2),
    omitTypeHints,
    omitEmptyOptionalProjectFields,
    R.converge(omitPatches, [
      R.compose(R.map(getPatchPath), listLibraryPatches),
      R.identity,
    ])
  )
);

export const prepareLibPatchesToInsertIntoProject = def(
  'prepareLibPatchesToInsertIntoProject :: String -> Project -> [Patch]',
  (libName, project) =>
    R.compose(
      R.map(
        R.compose(
          resolveNodeTypesInPatch,
          R.over(R.lensProp('path'), R.replace('@', libName))
        )
      ),
      listPatchesWithoutBuiltIns
    )(project)
);
