import { loader } from '@aurelia/webpack-loader';
import { assert } from '@aurelia/testing';

function preprocess(
  filePath: string,
  contents: string,
  basePath: string = '',
  defaultShadowOptions: { mode: 'open' | 'closed' } | null = null,
  stringModuleWrap: ((id: string) => string) | null = null
) {
  return {
    code: 'processed ' + (defaultShadowOptions ? (JSON.stringify(defaultShadowOptions) +
          ' ') : '') + (defaultShadowOptions && stringModuleWrap ? stringModuleWrap(filePath) : filePath) + ' ' + contents,
    map: { version: 3 }
  };
}

describe('webpack-loader', function () {
  it('transforms html file', function(done) {
    const content = 'content';
    const expected = 'processed src/foo-bar.html content';

    const context = {
      async: () => function(err, code, map) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(code, expected);
        assert.equal(map.version, 3);
        done();
      },
      resourcePath: 'src/foo-bar.html'
    };

    loader.call(context, content, preprocess);
  });

  it('transforms html file in shadowDOM mode', function(done) {
    const content = 'content';
    const expected = 'processed {"mode":"open"} raw-loader!src/foo-bar.html content';

    const context = {
      async: () => function(err, code, map) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(code, expected);
        assert.equal(map.version, 3);
        done();
      },
      query: { defaultShadowOptions: { mode: 'open' } },
      resourcePath: 'src/foo-bar.html'
    };

    loader.call(context, content, preprocess);
  });

  it('transforms js file', function(done) {
    const content = 'content';
    const expected = 'processed src/foo-bar.js content';

    const context = {
      async: () => function(err, code, map) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(code, expected);
        assert.equal(map.version, 3);
        done();
      },
      resourcePath: 'src/foo-bar.js'
    };

    loader.call(context, content, preprocess);
  });

  it('transforms ts file', function(done) {
    const content = 'content';
    const expected = 'processed src/foo-bar.ts content';

    const context = {
      async: () => function(err, code, map) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(code, expected);
        assert.equal(map.version, 3);
        done();
      },
      resourcePath: 'src/foo-bar.ts'
    };

    loader.call(context, content, preprocess);
  });

  it('bypass other file', function(done) {
    const content = 'content';
    const notExpected = 'processed src/foo-bar.css content';

    const context = {
      async: () => function(err, code, map) {
        if (err) {
          done(err);
          return;
        }
        assert.equal(code, content);
        assert.equal(map, undefined);
        done();
      },
      resourcePath: 'src/foo-bar.css'
    };

    loader.call(context, content, preprocess);
  });
});

