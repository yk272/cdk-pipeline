import * as codebuild from "@aws-cdk/aws-codebuild";
import { Artifact, Pipeline } from "@aws-cdk/aws-codepipeline";
import { SimpleSynthAction } from "@aws-cdk/pipelines";
import { CodeBuildAction, GitHubSourceAction } from "@aws-cdk/aws-codepipeline-actions";
import * as cdk from "@aws-cdk/core";
export class WorkshopPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const pipeline = new Pipeline(this, "TestPipeline", {
      pipelineName: "TestPipeline"
    });
    const project = new codebuild.PipelineProject(this, "TestPipelineProject");
    // STAGE 1: SOURCE
    const sourceOutput = new Artifact();
    const sourceAction = new GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "tra-mes",
      repo: "idenversio",
      oauthToken: cdk.SecretValue.secretsManager("internal/r2d2/token/github"),
      output: sourceOutput,
      branch: "qa" // default: 'master'
    });
    pipeline.addStage({
      stageName: "Source",
      actions: [sourceAction]
    });

    // STAGE 2: BUILD
    const buildOutput = new Artifact();
    const buildAction = new CodeBuildAction({
      actionName: "LernaBuild",
      input: sourceOutput,
      project,
      outputs: [buildOutput]
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [buildAction]
    });

    // STAGE 3: SYNTH
    const synthOutput = new Artifact();
    const synthAction = SimpleSynthAction.standardYarnSynth({
      sourceArtifact: buildOutput,
      cloudAssemblyArtifact: synthOutput,
      subdirectory: "packages/cdk-app"
    });
    pipeline.addStage({
      stageName: "Synth",
      actions: [synthAction]
    });
  }
}